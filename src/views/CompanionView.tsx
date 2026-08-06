import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, Language, UserStats, ViewType } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { ItemIcon } from '../components/ItemIcon';
import { t } from '../lib/i18n';
import { Zap, Package, X, AlertCircle, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { CardItem } from '../components/CardItem';
import { PageHeader } from '../components/PageHeader';
import { SNS_ECONOMY_COSTS } from '../content/snsEconomy';
import { Item, EquipmentSlot } from '../types';
import { SkillView } from './SkillView';
import { getCardStatWithBonus, getCardPower, INITIAL_SKILLS } from '../constants';

interface CompanionViewProps {
  companion: CardData | null;
  sns: number;
  updateSns: (amount: number) => void;
  updateCompanion: (data: Partial<CardData>) => void;
  onBack: () => void;
  onNavigate: (view: ViewType) => void;
  language: Language;
  playSfx: (url: string) => void;
  customCardImage?: string | null;
  selectedCompanionIndex?: number;
  setSelectedCompanionIndex?: (idx: number) => void;
  currentDeck?: (CardData | null)[];
  itemList: Item[];
  equipItem: (itemId: string, deckIndex: number) => void;
  unequipItem: (itemId: string, deckIndex: number) => void;
  updateStats: (stats: Partial<UserStats>) => void;
  skillPoints: number;
  isImpersonating?: boolean;
  setGlobalPopupOpen?: (open: boolean) => void;
  onUpgradeSkill?: (skillId: string) => void;
  onResetSkills?: () => void;
}

const HELP_STEPS = [
  { titleKey: 'companion_help_nurture', descKey: 'companion_help_nurture_desc' },
  { titleKey: 'companion_help_inventory', descKey: 'companion_help_inventory_desc' },
  { titleKey: 'companion_help_skills', descKey: 'companion_help_skills_desc' },
];

export const CompanionView: React.FC<CompanionViewProps> = ({
  companion,
  sns,
  updateSns,
  updateCompanion,
  onBack,
  onNavigate,
  language,
  playSfx,
  customCardImage,
  selectedCompanionIndex = 0,
  setSelectedCompanionIndex,
  currentDeck = [],
  itemList,
  equipItem,
  unequipItem,
  updateStats,
  skillPoints,
  isImpersonating = false,
  setGlobalPopupOpen,
  onUpgradeSkill,
  onResetSkills
}) => {
  const [isInteracting, setIsInteracting] = useState<string | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showSkillTree, setShowSkillTree] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<'equipped' | 'all'>('equipped');
  const [floatingExps, setFloatingExps] = useState<{id: number, amount: number}[]>([]);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    if (helpOpen) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [helpOpen]);
  const [helpStep, setHelpStep] = useState(0);

  const displayItemList = useMemo(() => {
    if (!isImpersonating) return itemList;
    const simItems = ITEM_DATABASE.map((item, idx) => ({
      ...item,
      id: `sim-item-${idx}`,
      equippedToId: null
    }));
    return [...itemList, ...simItems];
  }, [itemList, isImpersonating]);

  useEffect(() => {
    if (setGlobalPopupOpen) {
      setGlobalPopupOpen(showInventory || showSkillTree || alertMsg !== null);
    }
  }, [showInventory, showSkillTree, alertMsg, setGlobalPopupOpen]);
  
  const growth = companion?.growth || 0;
  const hunger = companion?.hunger ?? 100;
  const happiness = companion?.happiness ?? 100;
  const level = companion?.level || 1;
  const exp = companion?.exp || 0;

  const nextLevelExp = Math.floor(100 * Math.pow(1.2, level - 1));

  const itemMagicChanceBonus = useMemo(() => {
    if (!companion || !companion.equipment) return 0;
    return Object.values(companion.equipment).reduce((acc: number, item: any) => {
      return acc + (item?.magicChance || 0);
    }, 0);
  }, [companion]);

  const handleAction = (type: 'feed' | 'play') => {
    const cost = type === 'feed'
      ? (isImpersonating ? 0 : SNS_ECONOMY_COSTS.companion.feed)
      : (isImpersonating ? 0 : SNS_ECONOMY_COSTS.companion.play);
    if (sns < cost) {
      playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      setAlertMsg(t('insufficient_sns', language));
      return;
    }

    const isHunger = type === 'feed';
    const currentVal = isHunger ? hunger : happiness;
    
    let xpGain = 0;
    const restoreAmount = isHunger ? 30 : 20; 
    const pointsAvailableAtFullEfficiency = Math.max(0, 100 - currentVal);
    
    if (pointsAvailableAtFullEfficiency >= restoreAmount) {
      xpGain = restoreAmount;
    } else {
      const standardPart = pointsAvailableAtFullEfficiency;
      const saturationPart = restoreAmount - pointsAvailableAtFullEfficiency;
      xpGain = standardPart + (saturationPart * 0.3333);
    }

    if (isImpersonating) xpGain *= 10;
    
    const displayXpGain = Math.floor(xpGain);
    if (displayXpGain > 0) {
      const id = Date.now();
      setFloatingExps(prev => [...prev, { id, amount: displayXpGain }]);
      setTimeout(() => {
        setFloatingExps(prev => prev.filter(f => f.id !== id));
      }, 1000);
    }

    playSfx('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
    setIsInteracting(isHunger ? 'eating' : 'playing');

    let updates: Partial<CardData> = {};
    if (isHunger) updates.hunger = Math.min(100, hunger + 30);
    else updates.happiness = Math.min(100, happiness + 20);

    if (type === 'play') updates.hunger = Math.max(0, (updates.hunger || hunger) - 10);

    updateSns(-cost);

    if (level < 100) {
      let currentLevel = level;
      let currentExp = exp + xpGain;
      let totalSkillPoints = 0;

      while (currentLevel < 100) {
        const requiredXp = Math.floor(100 * Math.pow(1.2, currentLevel - 1));
        if (currentExp >= requiredXp) {
          currentExp -= requiredXp;
          currentLevel++;
          totalSkillPoints += 1;
        } else {
          break;
        }
      }

      if (currentLevel > level) {
        updates.level = currentLevel;
        updates.exp = currentExp;
        updateStats({ skillPoints: totalSkillPoints });
        playSfx('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
      } else {
        updates.exp = currentExp;
      }
    }

    let growthChance = 0.001 + (hunger > 80 && happiness > 80 ? 0.009 : 0);
    if (Math.random() < growthChance && growth < 5) {
      updates.growth = growth + 1;
      setIsInteracting('evolving');
    }

    updateCompanion(updates);
    setTimeout(() => setIsInteracting(null), 2000);
  };

  const getStageName = (stage: number) => {
    const names: Record<number, string> = {
      0: t('stage_egg', language),
      1: t('stage_baby', language),
      2: t('stage_child', language),
      3: t('stage_teen', language),
      4: t('stage_adult', language),
      5: t('stage_hero', language),
    };
    return names[stage] || names[0];
  };

  return (
    <div className="p-4 md:p-6 pb-32 flex flex-col gap-4 max-w-4xl mx-auto min-h-screen app-bg text-slate-800 font-sans">
      <PageHeader
        title={t('companion', language)}
        onBack={onBack}
        rightAction={
          <button
            type="button"
            onClick={() => { setHelpOpen(true); setHelpStep(0); }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        }
      />

      {/* Slot Selection */}
      <div className="flex justify-center gap-2.5 mt-1">
        {[0, 1, 2, 3, 4].map((idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCompanionIndex?.(idx)}
            className={cn(
              "w-10 h-10 rounded-lg border transition-all flex items-center justify-center font-bold text-xs shadow-xs",
              selectedCompanionIndex === idx 
                ? "border-indigo-650 bg-gradient-to-tr from-indigo-600 to-violet-650 text-white scale-105 shadow-md shadow-indigo-150" 
                : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-600 hover:bg-slate-50/50"
            )}
          >
            #{idx + 1}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        {/* Character Stage */}
        <div className="bg-white border border-slate-200/80 rounded-lg flex flex-col items-center justify-center p-6 relative overflow-hidden h-[280px] md:h-[420px] shadow-sm">
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isInteracting || growth}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 flex flex-col items-center"
            >
              <CardItem 
                card={companion || { 
                  name: "EMPTY_SLOT", 
                  power: 0, 
                  rarity: 'bronze', 
                  imageIndex: 0 
                } as any} 
                className={cn(
                  "w-32 h-44 md:w-52 md:h-72 shadow-2xl mb-2",
                  !companion && "opacity-30 grayscale"
                )} 
                customImage={customCardImage} 
              />

              {/* Floating EXP Effects */}
              <AnimatePresence>
                {floatingExps.map(fx => (
                  <motion.div
                    key={fx.id}
                    initial={{ y: 20, opacity: 0, scale: 0.6 }}
                    animate={{ y: -130, opacity: 1, scale: 1.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] text-yellow-450 font-extrabold text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] pointer-events-none"
                  >
                    +{fx.amount} EXP
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Interaction Overlays */}
              {isInteracting === 'eating' && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -40, opacity: 1 }} className="absolute top-0 text-4xl drop-shadow-md">🍖</motion.div>
              )}
              {isInteracting === 'playing' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1], rotate: [0, 15, -15, 0] }} className="absolute top-0 text-4xl">❤️</motion.div>
              )}
              {isInteracting === 'evolving' && (
                <motion.div animate={{ rotate: 360 }} className="absolute inset-0 border-4 border-dashed border-indigo-400 rounded-full" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Stats and Actions */}
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-5 rounded-lg space-y-4 shadow-md border border-slate-800">
            {/* Nurture Progress (Hunger & Happiness) */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>{t('hunger', language)}</span>
                  <span>{Math.floor(hunger)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${hunger}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      hunger > 50 ? "bg-emerald-500" : hunger > 20 ? "bg-amber-500" : "bg-rose-500 animate-pulse"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  <span>{t('happiness', language)}</span>
                  <span>{Math.floor(happiness)}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${happiness}%` }}
                    className={cn(
                      "h-full rounded-full transition-all",
                      happiness > 50 ? "bg-indigo-500" : happiness > 20 ? "bg-violet-500" : "bg-slate-600"
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleAction('feed')}
              id="companion-feed-btn"
              className="flex items-center justify-center gap-2 p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg active:scale-98 transition-all font-bold text-xs shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              🍖 {language === 'ko' ? '먹이' : 'FEED'}
            </button>
            <button 
              onClick={() => handleAction('play')}
              id="companion-play-btn"
              className="flex items-center justify-center gap-2 p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg active:scale-98 transition-all font-bold text-xs shadow-md shadow-rose-600/10 cursor-pointer"
            >
              ❤️ {language === 'ko' ? '놀기' : 'PLAY'}
            </button>
            <button 
              onClick={() => setShowInventory(true)}
              id="companion-inventory-btn"
              className="flex items-center justify-center gap-2 p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg active:scale-98 transition-all font-bold text-xs shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Package size={16} />
              {t('inventory', language)}
            </button>
            <button 
              onClick={() => setShowSkillTree(true)}
              id="companion-skill-btn"
              className="flex items-center justify-center gap-2 p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg active:scale-98 transition-all font-bold text-xs uppercase shadow-md shadow-indigo-600/20 border border-indigo-500/10 cursor-pointer"
            >
              <Zap size={16} />
              {t('skills', language)}
            </button>
          </div>
        </div>
      </div>

      {/* Inventory Modal */}
      <AnimatePresence>
        {showInventory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-2xl h-[80vh] rounded-lg overflow-hidden flex flex-col shadow-2xl border border-slate-100"
            >
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="text-indigo-400" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">{t('inventory', language)}</h3>
                </div>
                <button 
                  onClick={() => setShowInventory(false)} 
                  className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex bg-slate-50/50 border-b border-slate-200/60">
                <button 
                  onClick={() => setInventoryTab('equipped')}
                  className={cn(
                    "flex-1 py-3.5 font-bold text-xs uppercase transition-all border-b-2",
                    inventoryTab === 'equipped' 
                      ? "border-indigo-650 text-indigo-650 bg-white" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {t('equipment', language)}
                </button>
                <button 
                  onClick={() => setInventoryTab('all')}
                  className={cn(
                    "flex-1 py-3.5 font-bold text-xs uppercase transition-all border-b-2",
                    inventoryTab === 'all' 
                      ? "border-indigo-650 text-indigo-650 bg-white" 
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  )}
                >
                  {t('inventory', language)}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-50/30">
                {inventoryTab === 'equipped' ? (
                  <div className="grid grid-cols-3 gap-3 w-full">
                    {(['necklace', 'ring2', 'boots', 'ring1'] as const).map(slot => {
                      const equippedItem = companion?.equipment?.[slot];
                      return (
                        <div key={slot} className="flex flex-col items-center gap-1.5">
                          <div className={cn(
                            "w-12 h-12 rounded-xl border flex items-center justify-center transition-all bg-slate-50 overflow-hidden",
                            equippedItem ? "border-indigo-500 bg-white shadow-md shadow-indigo-50" : "border-slate-200/70 opacity-40"
                          )}>
                            {equippedItem ? (
                              <ItemIcon imageIndex={equippedItem.imageIndex} size={40} />
                            ) : (
                              <Package size={16} className="text-slate-350" />
                            )}
                          </div>
                          <span className="text-[8px] font-bold text-slate-500 uppercase truncate w-full text-center">{t(`slot_${slot}`, language)}</span>
                          {equippedItem && (
                            <button 
                              onClick={() => unequipItem(equippedItem.id, selectedCompanionIndex)}
                              className="text-[8px] bg-rose-50 text-rose-650 px-1.5 py-0.5 rounded-md font-bold hover:bg-rose-100/60 transition-colors cursor-pointer"
                            >
                              {t('unequip', language)}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {displayItemList.filter(i => !i.equippedToId).length === 0 ? (
                      <div className="py-12 text-center text-slate-400 text-xs italic">{t('no_items', language)}</div>
                    ) : (
                      displayItemList.filter(i => !i.equippedToId).map(item => (
                        <div key={item.id} className={cn(
                          "p-4 border rounded-lg flex items-center justify-between transition-colors",
                          item.rarity === 'rare' ? "border-amber-200 bg-amber-50/30" : 
                          item.rarity === 'magic' ? "border-indigo-200 bg-indigo-50/20" : "border-slate-100 bg-white"
                        )}>
                          <div className="flex gap-4 items-center min-w-0">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-150 shrink-0">
                               <ItemIcon imageIndex={item.imageIndex} size={40} />
                            </div>
                            <div className="min-w-0">
                               <div className="flex items-center gap-2">
                                 <h5 className="text-xs font-bold text-slate-800 truncate">{(language === 'ko' ? item.name_ko : item.name_en)}</h5>
                                 <span className={cn(
                                   "text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0",
                                   item.rarity === 'rare' ? "bg-amber-100 text-amber-800" : 
                                   item.rarity === 'magic' ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-650"
                                  )}>{t(`rarity_${item.rarity}` as any, language)}</span>
                                </div>
                               <p className="text-[9px] text-slate-400 mt-1 italic leading-tight truncate">{(language === 'ko' ? item.description_ko : item.description_en)}</p>
                               <div className="flex flex-wrap gap-2 mt-1.5 text-[8px] font-bold">
                                  <span className="text-slate-500 uppercase bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded">{item.stats.map(s => s >= 0 ? '+' + s : s).join(', ')}</span>
                                  {item.magicChance && (
                                    <span className="text-indigo-650 uppercase bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">Magic +{item.magicChance}%</span>
                                  )}
                                </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => equipItem(item.id, selectedCompanionIndex)}
                            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] px-3.5 py-1.5 rounded-xl font-bold uppercase transition-all shrink-0 ml-4 cursor-pointer"
                          >
                            {t('equip', language)}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Warning Popup */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full text-center border border-slate-100 shadow-2xl relative"
            >
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-rose-500" size={24} />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-5">{alertMsg}</p>
              <button
                onClick={() => setAlertMsg(null)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/10 transition-colors active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skill Tree Modal */}
      <AnimatePresence>
        {showSkillTree && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-slate-950/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.98, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: 15 }}
              className="bg-white w-full md:max-w-5xl h-full md:h-[90vh] md:rounded-3xl flex flex-col shadow-2xl relative border border-slate-100 overflow-hidden"
            >
              <div className="absolute top-4 right-4 z-[70]">
                <button 
                  onClick={() => setShowSkillTree(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-full border border-slate-200 shadow-xl transition-transform active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <SkillView 
                  skills={companion?.skills || INITIAL_SKILLS}
                  language={language}
                  onNavigate={onNavigate}
                  onUpgradeSkill={onUpgradeSkill || (() => {})}
                  onResetSkills={onResetSkills || (() => {})}
                  onBack={() => setShowSkillTree(false)}
                  companionLevel={companion?.level || 1}
                  skillPoints={skillPoints}
                  sns={sns}
                  isImpersonating={isImpersonating}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Popup */}
      <AnimatePresence>
        {helpOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <X size={14} />
              </button>

              <div className="text-center mb-5">
                <HelpCircle size={24} className="mx-auto text-indigo-500 mb-2" />
                <h3 className="text-sm font-black text-slate-900">
                  {t(HELP_STEPS[helpStep].titleKey, language)}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {t(HELP_STEPS[helpStep].descKey, language)}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.max(0, s - 1))}
                  disabled={helpStep === 0}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-1.5">
                  {HELP_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-colors',
                        i === helpStep ? 'bg-indigo-500' : 'bg-slate-200',
                      )}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpStep((s) => Math.min(HELP_STEPS.length - 1, s + 1))}
                  disabled={helpStep === HELP_STEPS.length - 1}
                  className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
