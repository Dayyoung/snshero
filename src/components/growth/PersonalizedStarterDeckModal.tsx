import React, { useState } from 'react';
import { CardData, Language } from '../../types';
import { useGameSettings } from '../../contexts/GameSettingsContext';
import { triggerHaptic } from '../../lib/haptic';

export interface PersonalizedStarterDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeployToBattle: (deck: CardData[]) => void;
  language?: Language;
}

export interface StarterDeckPreset {
  id: 'KADAN_VANGUARD' | 'PALADIN_SANCTUARY' | 'IGNIS_ELEMENTAL';
  titleKey: string;
  descKey: string;
  borderClass: string;
  accentText: string;
  cards: CardData[];
}

export const STARTER_DECK_PRESETS: StarterDeckPreset[] = [
  {
    id: 'KADAN_VANGUARD',
    titleKey: 'vanguardTitle',
    descKey: 'vanguardDesc',
    borderClass: 'border-amber-500/60 hover:border-amber-400',
    accentText: 'text-amber-400',
    cards: [
      { id: '41', title: '카단 (Kadan)', power: 950, stats: [9, 8, 7, 8], rarity: 'legendary', title_dis: '끝까지 버티는 방패', level: 1, element: 'water' },
      { id: '50', title: '알렉산다르 (Alexandar)', power: 880, stats: [8, 8, 6, 7], rarity: 'gold', title_dis: '선술집 다리의 영웅', level: 1, element: 'earth' },
      { id: '49', title: '헤르쿨 (Herkul)', power: 820, stats: [8, 6, 6, 6], rarity: 'gold', title_dis: '순례자 성기사', level: 1, element: 'earth' },
      { id: '42', title: '엘윈 (Elwin)', power: 760, stats: [7, 7, 5, 6], rarity: 'silver', title_dis: '설원의 수호자', level: 1, element: 'water' },
      { id: '90', title: '페가수스 (Pegasus)', power: 700, stats: [6, 6, 5, 5], rarity: 'bronze', title_dis: '전설의 천마', level: 1, element: 'wind' },
    ]
  },
  {
    id: 'PALADIN_SANCTUARY',
    titleKey: 'sanctuaryTitle',
    descKey: 'sanctuaryDesc',
    borderClass: 'border-cyan-500/60 hover:border-cyan-400',
    accentText: 'text-cyan-400',
    cards: [
      { id: '43', title: '발리안 (Valian)', power: 920, stats: [8, 9, 7, 8], rarity: 'legendary', title_dis: '아케인 창의 성기사', level: 1, element: 'wind' },
      { id: '62', title: '실리아 (Cilia)', power: 850, stats: [6, 9, 8, 8], rarity: 'gold', title_dis: '상냥한 치유사', level: 1, element: 'water' },
      { id: '80', title: '아이언포지 (Ironforge)', power: 780, stats: [7, 8, 7, 7], rarity: 'silver', title_dis: '고대 전략가', level: 1, element: 'earth' },
      { id: '1', title: '아쿠아리스 (Aquaris)', power: 720, stats: [6, 7, 7, 7], rarity: 'silver', title_dis: '샘의 수호정령', level: 1, element: 'water' },
      { id: '2', title: '나이아드 (Naiad)', power: 650, stats: [5, 6, 7, 6], rarity: 'bronze', title_dis: '물의 요정', level: 1, element: 'water' },
    ]
  },
  {
    id: 'IGNIS_ELEMENTAL',
    titleKey: 'elementalTitle',
    descKey: 'elementalDesc',
    borderClass: 'border-red-500/60 hover:border-red-400',
    accentText: 'text-red-400',
    cards: [
      { id: '11', title: '이그니스 (Ignis)', power: 940, stats: [9, 7, 6, 8], rarity: 'legendary', title_dis: '진실의 화염술사', level: 1, element: 'fire' },
      { id: '13', title: '벨페고르 (Belphegor)', power: 860, stats: [8, 7, 6, 7], rarity: 'gold', title_dis: '화염의 심판자', level: 1, element: 'fire' },
      { id: '23', title: '실피드 (Sylphid)', power: 790, stats: [7, 7, 6, 6], rarity: 'silver', title_dis: '바람의 정령', level: 1, element: 'wind' },
      { id: '25', title: '에올루스 (Aeolus)', power: 730, stats: [6, 7, 5, 6], rarity: 'silver', title_dis: '폭풍의 군주', level: 1, element: 'wind' },
      { id: '99', title: '마기테크 골렘 (Magitech Golem)', power: 670, stats: [6, 6, 5, 5], rarity: 'bronze', title_dis: '고대 마도 병기', level: 1, element: 'earth' },
    ]
  }
];

const STARTER_I18N: Record<string, Record<string, string>> = {
  ko: {
    modalTitle: '[눈히어로 판타지 // 엘윈 설원 전투 유파 선택]',
    badge: '카단 연대기 공식 3대 영웅 유파 덱',
    subtitle: '원작 판타지 소설의 영웅들로 구성된 스타터 덱을 선택하여 엘윈 대륙으로 출격하세요.',
    vanguardTitle: '카단 서리 돌격 유파 (Kadan Vanguard)',
    vanguardDesc: '주인공 카단과 아버지 알렉산다르, 순례자 헤르쿨이 이끄는 냉기 참격 돌격 덱.',
    sanctuaryTitle: '발리안 & 실리아 성기사 유파 (Holy Sanctuary)',
    sanctuaryDesc: '성기사 발리안과 치유사 실리아의 아케인 창과 결계로 적을 막아내는 철벽 수호 덱.',
    elementalTitle: '이그니스 정령 화염 유파 (Ignis Sorcery)',
    elementalDesc: '화염술사 이그니스와 바람의 정령 실피드가 폭발적인 원소 마법으로 적을 섬멸하는 덱.',
    deployBtn: '[선택 유파로 엘윈 대륙 출격]',
    close: '[닫기]'
  },
  en: {
    modalTitle: '[SNOW HERO // SELECT ELWIN COMBAT DOCTRINE]',
    badge: 'OFFICIAL KADAN CHRONICLES 3 HERO PRESETS',
    subtitle: 'Select your starter hero deck curated from the original fantasy novel and march to Elwin continent.',
    vanguardTitle: 'Kadan Frost Vanguard Doctrine',
    vanguardDesc: 'Led by protagonist Kadan, Alexandar, and Herkul. High-impact frost blade rush.',
    sanctuaryTitle: 'Valian & Cilia Holy Sanctuary',
    sanctuaryDesc: 'Led by Paladin Valian and Healer Cilia. Impenetrable barrier and holy counter defense.',
    elementalTitle: 'Ignis Elemental Sorcery',
    elementalDesc: 'Led by Flame Mage Ignis and Wind Sylphid. High-burst fire and storm magic.',
    deployBtn: '[MARCH WITH SELECTED DOCTRINE]',
    close: '[CLOSE]'
  }
};

export const PersonalizedStarterDeckModal: React.FC<PersonalizedStarterDeckModalProps> = ({
  isOpen,
  onClose,
  onDeployToBattle,
  language = 'ko'
}) => {
  const { theme } = useGameSettings();
  const [selectedPresetId, setSelectedPresetId] = useState<'KADAN_VANGUARD' | 'PALADIN_SANCTUARY' | 'IGNIS_ELEMENTAL'>('KADAN_VANGUARD');

  const t = STARTER_I18N[language] || STARTER_I18N.ko;

  if (!isOpen) return null;

  const currentPreset = STARTER_DECK_PRESETS.find(p => p.id === selectedPresetId) || STARTER_DECK_PRESETS[0];

  const handleSelect = (id: 'KADAN_VANGUARD' | 'PALADIN_SANCTUARY' | 'IGNIS_ELEMENTAL') => {
    triggerHaptic('tap');
    setSelectedPresetId(id);
  };

  const handleDeploy = () => {
    triggerHaptic('victory');
    // 영구 인벤토리 및 기본 덱에 등록
    try {
      const currentSeason = localStorage.getItem('hero_current_season') || 'season1';
      const deckKey = `hero_deck_${currentSeason}`;
      localStorage.setItem(deckKey, JSON.stringify(currentPreset.cards.map(c => c.id)));
      localStorage.setItem('hero_starter_deck_chosen', 'true');
    } catch {
      // ignore
    }
    onDeployToBattle(currentPreset.cards);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[250] bg-black/85 flex items-center justify-center p-3 font-mono text-xs select-none animate-fade-in"
    >
      <div className="w-full max-w-xl max-h-[92dvh] bg-[#141212] border border-stone-800 rounded-none text-stone-200 flex flex-col relative overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between shrink-0 bg-[#181616]">
          <div>
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
              {t.badge}
            </div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              {t.modalTitle}
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

        {/* 3대 유파 탭 선택기 (OpenCode.ai 모노스페이스 플랫) */}
        <div className="grid grid-cols-3 border-b border-stone-800 bg-stone-900/60 shrink-0">
          {STARTER_DECK_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelect(preset.id)}
                className={`py-3 px-2 text-center border-r last:border-r-0 border-stone-800 font-bold text-xs transition-all ${
                  isSelected
                    ? 'bg-amber-950/30 text-amber-300 border-b-2 border-b-amber-400'
                    : 'text-stone-400 hover:text-white bg-transparent'
                }`}
              >
                <div className="truncate">
                  {preset.id === 'KADAN_VANGUARD' && '[카단 돌격 유파]'}
                  {preset.id === 'PALADIN_SANCTUARY' && '[성기사 수호 유파]'}
                  {preset.id === 'IGNIS_ELEMENTAL' && '[이그니스 화염 유파]'}
                </div>
              </button>
            );
          })}
        </div>

        {/* 선택된 유파 설명 및 카드 5장 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="p-3 bg-stone-900 border border-stone-800 rounded-none space-y-1">
            <div className={`text-xs font-bold ${currentPreset.accentText}`}>
              {t[currentPreset.titleKey]}
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              {t[currentPreset.descKey]}
            </p>
          </div>

          <div className="text-[11px] text-stone-400 font-bold uppercase tracking-wider">
            [배치 영웅 카드 5장 명단]
          </div>

          <div className="space-y-2">
            {currentPreset.cards.map((card, idx) => (
              <div
                key={card.id}
                className="p-2.5 bg-stone-900/70 border border-stone-800 rounded-none flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] text-amber-400 font-mono font-bold w-4">
                    #{card.id}
                  </span>
                  <div className="truncate">
                    <span className="font-bold text-white block truncate">{card.title}</span>
                    <span className="text-[10px] text-stone-500 block truncate">{card.title_dis}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.2 bg-stone-800 text-stone-300 border border-stone-700 uppercase font-bold">
                    {card.rarity}
                  </span>
                  <span className="text-amber-400 font-bold text-xs font-mono">
                    전투력 {card.power}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 하단 액션 버튼 */}
        <div className="p-4 border-t border-stone-800 bg-[#181616] flex gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] rounded-sm border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold text-xs"
          >
            {t.close}
          </button>
          <button
            type="button"
            onClick={handleDeploy}
            className="flex-2 min-h-[44px] rounded-sm border border-amber-500 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2"
          >
            <span>{t.deployBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedStarterDeckModal;
