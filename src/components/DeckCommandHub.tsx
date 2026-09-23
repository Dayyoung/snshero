import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  Swords, 
  Layers, 
  Package, 
  Star, 
  Share2, 
  Camera, 
  Trash2, 
  Flame, 
  Trophy, 
  QrCode,
  Compass,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

export type DeckHubCategory = 'ai' | 'inventory' | 'presets' | 'codex';

export interface DeckCommandHubProps {
  language: string;
  // AI Actions
  onOptimizeDeck: () => void;
  onAutoFillOptimalSynergy: () => void;
  onCompareCards: () => void;
  onOpenSynergyModal: () => void;
  onOpenAutoBuilder?: () => void;
  onOpenSynergyMastery?: () => void;
  // Inventory & Growth Actions
  onOpenInventory: () => void;
  onOpenEquipment: () => void;
  onOpenCombine: () => void;
  onOpenHeroNurture: () => void;
  onOpenCardUpgrade?: () => void;
  onOpenInventoryExpansion?: () => void;
  maxInventorySlots?: number;
  // Presets & Tools Actions
  activeDeckPreset: number;
  onSwitchDeckPreset: (presetNum: number) => void;
  onOpenPresetCode: () => void;
  onShareDeck: () => void;
  onOpen3DViewer: () => void;
  onOpenDisassemble: () => void;
  // Codex & Info Actions
  onOpenElementAdvantage: () => void;
  onOpenAchievements: () => void;
  achievementProgressPercent?: number;
  // Status info
  inventoryCount?: number;
  deckPower?: number;
}

export const DeckCommandHub: React.FC<DeckCommandHubProps> = ({
  language,
  onOptimizeDeck,
  onAutoFillOptimalSynergy,
  onCompareCards,
  onOpenSynergyModal,
  onOpenAutoBuilder,
  onOpenSynergyMastery,
  onOpenInventory,
  onOpenEquipment,
  onOpenCombine,
  onOpenHeroNurture,
  onOpenCardUpgrade,
  onOpenInventoryExpansion,
  maxInventorySlots,
  activeDeckPreset,
  onSwitchDeckPreset,
  onOpenPresetCode,
  onShareDeck,
  onOpen3DViewer,
  onOpenDisassemble,
  onOpenElementAdvantage,
  onOpenAchievements,
  achievementProgressPercent = 0,
  inventoryCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<DeckHubCategory>('ai');

  const tabs: { id: DeckHubCategory; labelKo: string; labelEn: string; icon: string; badge?: string }[] = [
    { id: 'ai', labelKo: 'AI 편성', labelEn: 'AI Lineup', icon: '⚡' },
    { id: 'inventory', labelKo: '인벤토리·육성', labelEn: 'Vault & Growth', icon: '📦', badge: inventoryCount > 0 ? `${inventoryCount}` : undefined },
    { id: 'presets', labelKo: '프리셋·도구', labelEn: 'Presets & Tools', icon: '⚙️' },
    { id: 'codex', labelKo: '도감·상성', labelEn: 'Codex & Affinity', icon: '📖' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto my-2 font-mono bg-stone-900 text-stone-100 border border-stone-800 rounded-none shadow-sm overflow-hidden select-none">
      {/* Hub Top Bar: Header & Category Tabs */}
      <div className="border-b border-stone-800 bg-stone-950/80 px-2 sm:px-3 pt-2 pb-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
            <span className="text-amber-400">❖</span>
            <span className="tracking-tight uppercase">
              {language === 'ko' ? '덱 통합 커맨드 허브' : 'DECK COMMAND HUB'}
            </span>
          </div>
          <div className="text-[10px] text-stone-400 flex items-center gap-1">
            <span>[DECK #{activeDeckPreset}]</span>
          </div>
        </div>

        {/* Category Navigation Tabs (Pure Mobile Touch 44px+) */}
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
                className={cn(
                  "relative flex flex-col sm:flex-row items-center justify-center gap-1 min-h-[44px] py-1.5 px-1 text-center transition-all cursor-pointer rounded-sm text-xs font-bold",
                  isActive
                    ? "bg-stone-800 text-amber-300 border-b-2 border-amber-400"
                    : "text-stone-400 hover:text-stone-200 hover:bg-stone-900/60"
                )}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="text-[11px] sm:text-xs truncate">
                  {language === 'ko' ? tab.labelKo : tab.labelEn}
                </span>
                {tab.badge && (
                  <span className="hidden sm:inline-block px-1 py-0.2 text-[9px] bg-stone-700 text-stone-300 rounded-none ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Panels */}
      <div className="p-2 sm:p-3 bg-stone-900/90 min-h-[110px]">
        {/* TAB 1: AI Lineup */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOptimizeDeck}
              className="min-h-[48px] p-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-300 border border-amber-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
              title={language === 'ko' ? '전투력 기준 최강 조합 자동 편성' : 'Auto Best Deck Lineup'}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-200">
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                <span>{language === 'ko' ? '최강 덱 자동편성' : 'Auto Best Deck'}</span>
              </div>
              <span className="text-[10px] text-amber-300/70 mt-0.5">
                {language === 'ko' ? '전투력 극대화' : 'Max Power'}
              </span>
            </button>

            <button
              type="button"
              onClick={onAutoFillOptimalSynergy}
              className="min-h-[48px] p-2 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
              title={language === 'ko' ? '보유 카드 중 최고 시너지 조합 채우기' : 'Auto Optimal Synergy'}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-300">
                <Sparkles size={14} className="text-indigo-400" />
                <span>{language === 'ko' ? '시너지 자동완성' : 'Auto Synergy'}</span>
              </div>
              <span className="text-[10px] text-indigo-400/70 mt-0.5">
                {language === 'ko' ? '속성·팩션 공명' : 'Element Resonate'}
              </span>
            </button>

            {onOpenAutoBuilder && (
              <button
                type="button"
                onClick={onOpenAutoBuilder}
                className="min-h-[48px] p-2 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 border border-amber-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '1-Tap 원클릭 스마트 AI 덱 빌더' : '1-Tap AI Deck Builder'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>{language === 'ko' ? '1-Tap AI 덱' : '1-Tap AI Deck'}</span>
                </div>
                <span className="text-[10px] text-amber-400/70 mt-0.5">
                  {language === 'ko' ? '원클릭 맞춤 덱' : 'Smart Builder'}
                </span>
              </button>
            )}

            {onOpenSynergyMastery && (
              <button
                type="button"
                onClick={onOpenSynergyMastery}
                className="min-h-[48px] p-2 bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-600/50 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '시너지 콤보 트리 및 마스터리' : 'Synergy Mastery Tree'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-200">
                  <Flame size={14} className="text-pink-400" />
                  <span>{language === 'ko' ? '시너지 트리' : 'Synergy Tree'}</span>
                </div>
                <span className="text-[10px] text-indigo-300/70 mt-0.5">
                  {language === 'ko' ? '콤보 해금 & 마스터리' : 'Combos & Tree'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onCompareCards}
              className="min-h-[48px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
              title={language === 'ko' ? '카드 1:1 스탯 및 스킬 비교' : '1:1 Card Compare'}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-stone-200">
                <Swords size={14} className="text-amber-400" />
                <span>{language === 'ko' ? '1:1 카드 비교' : '1:1 Compare'}</span>
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5">
                {language === 'ko' ? '스탯 & 스킬 대조' : 'Stats & Skills'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSynergyModal}
              className="min-h-[48px] p-2 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
              title={language === 'ko' ? '활성 시너지 및 버프 상세 효과 확인' : 'Synergy Buff Details'}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                <Compass size={14} className="text-purple-400" />
                <span>{language === 'ko' ? '시너지 효과 분석' : 'Synergy Info'}</span>
              </div>
              <span className="text-[10px] text-purple-400/70 mt-0.5">
                {language === 'ko' ? '버프 수치 확인' : 'Buff Overview'}
              </span>
            </button>
          </div>
        )}

        {/* TAB 2: Vault & Growth */}
        {activeTab === 'inventory' && (
          <div className="flex flex-col gap-2">
            {/* 카드 업그레이드 (스킬 & 능력치 강화) 전용 하이라이트 배너 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 bg-gradient-to-r from-amber-500/20 via-indigo-500/15 to-purple-500/20 border border-amber-400/60 rounded-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/25 text-amber-300 rounded-sm border border-amber-400/40 shrink-0">
                  <Zap size={18} className="text-amber-400 fill-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                    <span>{language === 'ko' ? '⚡ 카드 업그레이드' : '⚡ Card Upgrade'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 bg-amber-400 text-stone-950 font-black rounded-xs">
                      {language === 'ko' ? '스킬·스탯 강화' : 'SKILLS & STATS'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 mt-0.5">
                    {language === 'ko' ? '출전 카드의 스킬 트리 해금, 레벨업 및 잠재 능력치를 강화합니다.' : 'Unlock skill trees, level up, and enhance battle stats.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onOpenCardUpgrade?.()}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 font-black text-xs rounded-sm transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1 shrink-0"
                title={language === 'ko' ? '카드 업그레이드 화면 열기' : 'Open Card Upgrade Screen'}
              >
                <span>{language === 'ko' ? '업그레이드 화면 진입' : 'Open Upgrade'}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onOpenInventory}
                className="min-h-[48px] p-2 bg-blue-950/40 hover:bg-blue-900/50 text-blue-200 border border-blue-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '보유 카드 보관함 열기 및 덱 교체' : 'Card Vault & Replace'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-blue-300">
                  <Layers size={14} className="text-blue-400" />
                  <span>{language === 'ko' ? '카드 인벤토리' : 'Card Vault'}</span>
                </div>
                <span className="text-[10px] text-blue-400/70 mt-0.5">
                  {language === 'ko' ? `보유 ${inventoryCount}장 관리` : `${inventoryCount} Cards`}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenEquipment}
                className="min-h-[48px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '영웅별 장비 장착 및 관리' : 'Equipment Management'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-stone-200">
                  <Package size={14} className="text-cyan-400" />
                  <span>{language === 'ko' ? '장비 관리' : 'Equipment'}</span>
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5">
                  {language === 'ko' ? '무기·방어구 세팅' : 'Equip Items'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenCombine}
                className="min-h-[48px] p-2 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '동일 카드 3장 상위 등급 합성' : 'Card Combine'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-purple-300">
                  <Sparkles size={14} className="text-purple-400" />
                  <span>{language === 'ko' ? '카드 합성소' : 'Card Combine'}</span>
                </div>
                <span className="text-[10px] text-purple-400/70 mt-0.5">
                  {language === 'ko' ? '상위 티어 승급' : 'Upgrade Tier'}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenHeroNurture}
                className="min-h-[48px] p-2 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 border border-emerald-500/40 rounded-sm flex flex-col justify-center items-start text-left cursor-pointer transition-all active:scale-[0.98]"
                title={language === 'ko' ? '히어로 돌봄/훈련 및 호감도 강화' : 'Hero Nurture & Growth'}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                  <Star size={14} className="text-emerald-400" />
                  <span>{language === 'ko' ? '영웅 육성' : 'Hero Nurture'}</span>
                </div>
                <span className="text-[10px] text-emerald-400/70 mt-0.5">
                  {language === 'ko' ? '호감도 & 돌봄' : 'Bond & Training'}
                </span>
              </button>

              {onOpenInventoryExpansion && (
                <button
                  type="button"
                  onClick={onOpenInventoryExpansion}
                  className="col-span-2 sm:col-span-4 min-h-[44px] p-2 bg-stone-950/70 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
                  title={language === 'ko' ? '카드 보관함 슬롯 용량 확장' : 'Expand Card Vault Slots'}
                >
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-amber-400" />
                    <span className="font-bold text-xs">
                      {language === 'ko' ? '🎒 가방 용량 확장' : '🎒 Expand Vault Slots'}
                    </span>
                  </div>
                  <span className="text-[10px] text-amber-300 font-mono">
                    {inventoryCount}/{maxInventorySlots || 200} SLOTS [+]
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Presets & Tools */}
        {activeTab === 'presets' && (
          <div className="flex flex-col gap-2">
            {/* Quick Preset Selector */}
            <div className="flex items-center justify-between bg-stone-950 p-2 rounded-sm border border-stone-800">
              <span className="text-xs text-stone-400 font-bold">
                {language === 'ko' ? '프리셋 슬롯 선택:' : 'Preset Slot:'}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((presetNum) => (
                  <button
                    key={presetNum}
                    type="button"
                    onClick={() => onSwitchDeckPreset(presetNum)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-sm border transition-all cursor-pointer flex items-center gap-1",
                      activeDeckPreset === presetNum
                        ? "bg-amber-500 text-stone-950 border-amber-400 font-black"
                        : "bg-stone-800 text-stone-300 border-stone-700 hover:bg-stone-700"
                    )}
                  >
                    <span>DECK {presetNum}</span>
                    {activeDeckPreset === presetNum && <CheckCircle2 size={12} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={onOpenPresetCode}
                className="min-h-[44px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
                title="덱 코드 내보내기/불러오기 & QR"
              >
                <QrCode size={16} className="text-indigo-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-bold text-xs truncate">{language === 'ko' ? '덱 코드 & QR' : 'Code & QR'}</span>
                  <span className="text-[9px] text-stone-400">{language === 'ko' ? '공유·복사' : 'Export/Import'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onShareDeck}
                className="min-h-[44px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
                title="덱 자랑 및 소셜 공유"
              >
                <Share2 size={16} className="text-blue-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-bold text-xs truncate">{language === 'ko' ? '덱 공유' : 'Share Deck'}</span>
                  <span className="text-[9px] text-stone-400">{language === 'ko' ? 'SNS 링크 전송' : 'SNS Link'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpen3DViewer}
                className="min-h-[44px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
                title="3D/AR 덱 감상"
              >
                <Camera size={16} className="text-teal-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-bold text-xs truncate">{language === 'ko' ? '3D 뷰어' : '3D Viewer'}</span>
                  <span className="text-[9px] text-stone-400">{language === 'ko' ? '입체 카드 감상' : '3D Inspect'}</span>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenDisassemble}
                className="min-h-[44px] p-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 border border-rose-700/50 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
                title="잉여 카드 분해 및 재화 환급"
              >
                <Trash2 size={16} className="text-rose-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-bold text-xs truncate text-rose-300">{language === 'ko' ? '카드 분해소' : 'Disassemble'}</span>
                  <span className="text-[9px] text-rose-400/70">{language === 'ko' ? '재화 환급' : 'Scrap Refund'}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: Codex & Affinity */}
        {activeTab === 'codex' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={onOpenElementAdvantage}
              className="min-h-[48px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
              title="5대 원소 속성 상성 가이드"
            >
              <Flame size={16} className="text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-xs">{language === 'ko' ? '속성 상성표' : 'Affinity Chart'}</span>
                <span className="text-[10px] text-stone-400">{language === 'ko' ? '화/수/지/풍/무 상성' : '5 Elements'}</span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenAchievements}
              className="min-h-[48px] p-2 bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 border border-amber-500/40 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
              title="덱 수집 및 시즌 업적"
            >
              <Trophy size={16} className="text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-xs">{language === 'ko' ? '시즌 업적' : 'Achievements'}</span>
                <span className="text-[10px] text-amber-400/70">
                  {achievementProgressPercent}% {language === 'ko' ? '달성 완료' : 'Complete'}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={onOpenSynergyModal}
              className="col-span-2 sm:col-span-1 min-h-[48px] p-2 bg-stone-800/80 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-sm flex items-center gap-2 text-left cursor-pointer transition-all active:scale-[0.98]"
              title="팩션 및 영웅 인연 상세"
            >
              <ChevronRight size={16} className="text-purple-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-xs">{language === 'ko' ? '영웅 인연 도감' : 'Hero Bond Codex'}</span>
                <span className="text-[10px] text-stone-400">{language === 'ko' ? '시너지 조합표' : 'Synergy Details'}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckCommandHub;
