import React, { useState, useEffect } from 'react';
import {
  TACTICAL_PERKS_CATALOG,
  getUnlockedPerks,
  getHeroEquippedPerks,
  equipPerkToHero,
  unequipPerkFromHero,
  calculateHeroPerkModifiers,
  TacticalPerk
} from '../../utils/perkSystem';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface TacticalPassivePerksModalProps {
  isOpen: boolean;
  heroId: string | number;
  heroName?: string;
  onClose: () => void;
  onPerkUpdated?: () => void;
  language?: string;
}

const PERK_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '[카단 연대기 영웅 영혼 각인 소켓 // HERO PERK SOCKETS]',
    subtitle: '110종 미니게임 수련 업적으로 해금된 영구 각인을 영웅에게 장착합니다.',
    socketTitle: '영혼 각인 슬롯 (최대 3개)',
    emptySocket: '[빈 각인 슬롯 // 장착 가능]',
    unequipBtn: '[해제]',
    equipBtn: '[장착]',
    fullSocketsMsg: '3개 슬롯이 모두 찼습니다. 기존 각인을 해제 후 장착하세요.',
    availablePerksTitle: '해금된 설원 영웅 각인 풀',
    totalStatsTitle: '총 적용 영혼 각인 가중치',
    perkCritName: '[카단의 서리 참격] (+8% 치명타율)',
    perkCritDesc: '카단의 냉기 검술: 급소를 꿰뚫어 치명타 확률을 8% 상승시킵니다.',
    perkCdName: '[페가수스의 신속 돌파] (-10% 쿨다운)',
    perkCdDesc: '천마 페가수스의 속도: 스킬 쿨다운 주기를 10% 단축합니다.',
    perkShieldName: '[알렉산다르의 수호 방패] (+12% 보호막)',
    perkShieldDesc: '성기사 알렉산다르의 맹세: 전투 개시 시 최대 HP의 12% 보호막을 전개합니다.',
    perkPowerName: '[이그니스의 정령 화염] (+10% 공격력)',
    perkPowerDesc: '꺼지지 않는 불꽃의 힘: 기본 공격력을 10% 증폭시킵니다.',
    perkDrainName: '[실리아의 생명 정화] (+6% 생명력 흡수)',
    perkDrainDesc: '상냥한 치유사의 축복: 타격 시 피해량의 6%를 체력으로 회복합니다.',
    closeBtn: '[완료]'
  },
  en: {
    modalTitle: '[KADAN CHRONICLES HERO SOUL PERKS]',
    subtitle: 'EQUIP PERMANENT TRAITS UNLOCKED FROM 110 TRAINING SESSIONS',
    socketTitle: 'SOUL PERK SLOTS (MAX 3)',
    emptySocket: '[EMPTY SLOT // READY FOR PERK]',
    unequipBtn: '[REMOVE]',
    equipBtn: '[EQUIP]',
    fullSocketsMsg: 'All 3 sockets equipped. Remove an existing trait to slot another.',
    availablePerksTitle: 'UNLOCKED FROST PERK POOL',
    totalStatsTitle: 'ACTIVE SOUL MODIFIERS',
    perkCritName: '[KADAN FROST SLASH] (+8% CRIT CHANCE)',
    perkCritDesc: 'Kadan Ice Blade: Boosts critical strike probability by 8%.',
    perkCdName: '[PEGASUS AGILITY] (-10% COOLDOWN)',
    perkCdDesc: 'Pegasus Swiftness: Shortens skill reload intervals by 10%.',
    perkShieldName: '[ALEXANDAR BASTION] (+12% SHIELD)',
    perkShieldDesc: 'Paladin Oath: Grants 12% max HP shield at combat start.',
    perkPowerName: '[IGNIS FLAME SURGE] (+10% ATK)',
    perkPowerDesc: 'Spirit Blaze: Boosts base attack power by 10%.',
    perkDrainName: '[CILIA HOLY HEAL] (+6% LIFE DRAIN)',
    perkDrainDesc: 'Holy Blessing: Restores 6% of damage dealt as HP.',
    closeBtn: '[CLOSE]'
  }
};

export const TacticalPassivePerksModal: React.FC<TacticalPassivePerksModalProps> = ({
  isOpen,
  heroId,
  heroName = '영웅',
  onClose,
  onPerkUpdated,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [equippedIds, setEquippedIds] = useState<string[]>([]);
  const [unlockedPerks, setUnlockedPerks] = useState<TacticalPerk[]>([]);

  const t = PERK_I18N[language] || PERK_I18N.ko;

  const refreshState = () => {
    const equipped = getHeroEquippedPerks(heroId);
    setEquippedIds(equipped);
    const unlocked = getUnlockedPerks();
    setUnlockedPerks(unlocked);
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
    }
  }, [isOpen, heroId]);

  if (!isOpen) return null;

  const handleEquip = (perkId: string) => {
    triggerHaptic('tap');
    const res = equipPerkToHero(heroId, perkId);
    if (res.success) {
      refreshState();
      if (onPerkUpdated) onPerkUpdated();
    }
  };

  const handleUnequip = (perkId: string) => {
    triggerHaptic('tap');
    const res = unequipPerkFromHero(heroId, perkId);
    if (res.success) {
      refreshState();
      if (onPerkUpdated) onPerkUpdated();
    }
  };

  const modifiers = calculateHeroPerkModifiers(heroId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-lg max-h-[90dvh] bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              {heroName} // {t.modalTitle}
            </div>
            <p className="text-xs text-stone-400">
              {t.subtitle}
            </p>
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

        {/* 장착 슬롯 (최대 3개) */}
        <div className="p-4 border-b border-stone-800 bg-stone-900/60 shrink-0">
          <div className="text-xs font-bold text-stone-300 mb-2 flex items-center justify-between">
            <span>{t.socketTitle}</span>
            <span className="text-amber-400 text-[10px] font-bold">[{equippedIds.length}/3]</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((idx) => {
              const perkId = equippedIds[idx];
              const perk = TACTICAL_PERKS_CATALOG.find((p) => p.id === perkId);

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-none border flex flex-col justify-between min-h-[72px] text-left transition-all ${
                    perk
                      ? 'bg-amber-950/20 border-amber-500/60 text-white'
                      : 'bg-stone-950/50 border-dashed border-stone-800 text-stone-600'
                  }`}
                >
                  {perk ? (
                    <>
                      <div>
                        <span className="text-[9px] text-amber-400 uppercase font-bold block">
                          [SLOT {idx + 1}]
                        </span>
                        <span className="text-xs font-bold text-amber-300 line-clamp-1 mt-0.5">
                          {perk.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleUnequip(perk.id)}
                        className="mt-1 text-[10px] text-stone-400 hover:text-red-400 font-bold underline cursor-pointer text-left"
                      >
                        {t.unequipBtn}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full text-center">
                      <span className="text-[9px] text-stone-600 font-mono">[EMPTY]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 종합 스탯 보너스 요약 */}
        <div className="px-4 py-2 border-b border-stone-800 bg-[#161414] flex items-center justify-between text-[11px] text-stone-400 shrink-0">
          <span className="text-stone-500">{t.totalStatsTitle}:</span>
          <div className="flex items-center gap-3 font-bold text-amber-300">
            {modifiers.atkMultiplier > 1 && (
              <span>공격 +{Math.round((modifiers.atkMultiplier - 1) * 100)}%</span>
            )}
            {modifiers.critBonus > 0 && (
              <span>치명타 +{Math.round(modifiers.critBonus * 100)}%</span>
            )}
            {modifiers.shieldBonus > 0 && (
              <span>보호막 +{Math.round(modifiers.shieldBonus * 100)}%</span>
            )}
            {modifiers.cdReduction > 0 && (
              <span>쿨단축 -{Math.round(modifiers.cdReduction * 100)}%</span>
            )}
            {modifiers.atkMultiplier === 1 && modifiers.critBonus === 0 && modifiers.shieldBonus === 0 && (
              <span className="text-stone-600 font-normal">특성 미장착</span>
            )}
          </div>
        </div>

        {/* 해금된 각인 풀 스크롤 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-bold text-stone-400 mb-2">
            {t.availablePerksTitle}
          </div>

          {unlockedPerks.length === 0 ? (
            <div className="p-6 text-center text-stone-600 border border-stone-800 rounded-none bg-stone-950/40">
              미니게임을 플레이하여 영웅 각인을 해금하세요.
            </div>
          ) : (
            unlockedPerks.map((perk) => {
              const isEquipped = equippedIds.includes(perk.id);

              return (
                <div
                  key={perk.id}
                  className={`p-3 border rounded-none flex items-center justify-between gap-3 transition-all ${
                    isEquipped
                      ? 'bg-stone-900/40 border-stone-800 text-stone-500'
                      : 'bg-stone-900/80 border-stone-700 text-stone-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {perk.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-amber-400 border border-stone-700 rounded-none font-bold">
                        {perk.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1 leading-relaxed line-clamp-1">
                      {perk.description}
                    </p>
                  </div>

                  {isEquipped ? (
                    <button
                      type="button"
                      onClick={() => handleUnequip(perk.id)}
                      className="px-3 min-h-[36px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs font-bold shrink-0"
                    >
                      {t.unequipBtn}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={equippedIds.length >= 3}
                      onClick={() => handleEquip(perk.id)}
                      className={`px-3 min-h-[36px] rounded-sm border text-xs font-bold shrink-0 transition-all ${
                        equippedIds.length >= 3
                          ? 'border-stone-800 bg-stone-900 text-stone-600 cursor-not-allowed'
                          : 'border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300'
                      }`}
                    >
                      {t.equipBtn}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 하단 닫기 */}
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

export default TacticalPassivePerksModal;
export const HeroRuneEngravingModal = TacticalPassivePerksModal;
