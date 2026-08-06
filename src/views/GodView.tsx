import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Trash2, HelpCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ViewType, UserStats, CardData, Item, InventoryRecord } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { INITIAL_SKILLS, getCardPower, INITIAL_CARDS, syncCardWithDatabase } from '../constants';
import { ITEM_DATABASE } from '../constants/itemDatabase';
import { PageHeader } from '../components/PageHeader';

interface GodViewProps {
  language: string;
  onNavigate: (view: ViewType) => void;
  playSfx: (url: string) => void;
  stats: UserStats;
  setStats: React.Dispatch<React.SetStateAction<UserStats>>;
  sns: number;
  setSns: React.Dispatch<React.SetStateAction<number>>;
  currentDeck: CardData[];
  setCurrentDeck: React.Dispatch<React.SetStateAction<CardData[]>>;
  inventory: Record<number, InventoryRecord>;
  setInventory: React.Dispatch<React.SetStateAction<Record<number, InventoryRecord>>>;
  itemInventory: Item[];
  setItemInventory: React.Dispatch<React.SetStateAction<Item[]>>;
  ownedCards: CardData[];
  user?: any;
  syncUserData?: (data?: any) => Promise<void>;
}

const godHelpSteps = (lang: string) => [
  lang === 'ko'
    ? 'God Mode는 개발자/관리자용 패널입니다. 전적, SNS 재화, 덱 구성, 카드 능력치를 직접 수정할 수 있습니다.'
    : 'God Mode is a developer/admin panel. Directly modify stats, SNS currency, deck composition, and card abilities.',
  lang === 'ko'
    ? '상단 버튼으로 모든 카드를 최대 레벨로 올리거나, 모든 카드를 언락할 수 있습니다.'
    : 'Use the top buttons to max all cards or unlock every card.',
  lang === 'ko'
    ? '전적과 SNS 수치는 입력 후 APPLY/UPDATE 버튼을 눌러 적용하세요.'
    : 'Enter stats and SNS values, then press APPLY/UPDATE to apply.',
  lang === 'ko'
    ? '덱 슬롯을 클릭한 후 아래 카드 목록에서 카드를 선택하면 덱이 변경됩니다.'
    : 'Click a deck slot, then select a card from the grid below to assign it.',
  lang === 'ko'
    ? '보유 카드 목록에서 카드를 선택하면 레벨, 스킬, 장비를 개별 편집할 수 있습니다.'
    : 'Select a card from your inventory to edit its level, skills, and equipment individually.',
];

export const GodView: React.FC<GodViewProps> = ({
  language,
  onNavigate,
  playSfx,
  stats,
  setStats,
  sns,
  setSns,
  currentDeck,
  setCurrentDeck,
  inventory,
  setInventory,
  itemInventory,
  setItemInventory,
  ownedCards,
  user,
  syncUserData
}) => {
  const [winsInput, setWinsInput] = useState(stats.wins.toString());
  const [lossesInput, setLossesInput] = useState(stats.losses.toString());
  const [drawsInput, setDrawsInput] = useState(stats.draws.toString());
  const [snsInput, setSnsInput] = useState(sns.toString());

  React.useEffect(() => {
    setWinsInput(stats.wins.toString());
    setLossesInput(stats.losses.toString());
    setDrawsInput(stats.draws.toString());
  }, [stats]);

  React.useEffect(() => {
    setSnsInput(sns.toString());
  }, [sns]);

  const [selectedDeckSlot, setSelectedDeckSlot] = useState<number | null>(null);
  const [selectedCardToEdit, setSelectedCardToEdit] = useState<number | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  // Dispatch global popup events so bottom nav hides while help is open
  useEffect(() => {
    if (showHelp) {
      window.dispatchEvent(new Event('snshero-help-popup-open'));
    } else {
      window.dispatchEvent(new Event('snshero-help-popup-close'));
    }
  }, [showHelp]);

  const [helpStep, setHelpStep] = useState(0);
  const helpSteps = godHelpSteps(language);

  const handleStatsUpdate = async () => {
    const nextStats = {
      ...stats,
      wins: parseInt(winsInput) || 0,
      losses: parseInt(lossesInput) || 0,
      draws: parseInt(drawsInput) || 0
    };
    setStats(nextStats);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    if (user && user.uid !== 'guest-id' && syncUserData) {
      try {
        await syncUserData({ stats: nextStats });
      } catch (err) {
        console.error('Failed to sync user stats in God center:', err);
      }
    }
  };

  const handleSnsUpdate = async () => {
    const nextSns = parseInt(snsInput) || 0;
    setSns(nextSns);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');

    if (user && user.uid !== 'guest-id' && syncUserData) {
      try {
        await syncUserData({ sns: nextSns });
      } catch (err) {
        console.error('Failed to sync SNS in God center:', err);
      }
    }
  };

  const maxUpgradeAllCards = () => {
    const newInventory = { ...inventory };
    Object.keys(newInventory).forEach(key => {
      const id = parseInt(key);
      const rec = newInventory[id];
      rec.level = 100;
      rec.skills = INITIAL_SKILLS.map(s => ({ ...s, level: 100 }));
      
      const bestItems = Object.fromEntries(
        ['necklace', 'boots', 'ring1', 'ring2'].map(slot => {
          const itemBase = ITEM_DATABASE.find(i => i.slot === slot && i.rarity === 'rare') || ITEM_DATABASE.find(i => i.slot === slot);
          if (!itemBase) return [slot, undefined];
          return [slot, { ...itemBase, id: Math.random().toString(36).substring(2, 11) }];
        })
      );
      
      rec.equipment = bestItems as any;
    });
    setInventory(newInventory);
    
    setCurrentDeck(prev => prev.map(card => {
      if (!card) return card;
      const bestItems = Object.fromEntries(
        ['necklace', 'boots', 'ring1', 'ring2'].map(slot => {
          const itemBase = ITEM_DATABASE.find(i => i.slot === slot && i.rarity === 'rare') || ITEM_DATABASE.find(i => i.slot === slot);
          if (!itemBase) return [slot, undefined];
          return [slot, { ...itemBase, id: Math.random().toString(36).substring(2, 11) }];
        })
      );
      return {
        ...card,
        level: 100,
        skills: INITIAL_SKILLS.map(s => ({ ...s, level: 100 })),
        equipment: bestItems as any
      };
    }));
    playSfx('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
  };

  const unlockAllCards = () => {
    const newInventory = { ...inventory };
    Object.keys(CARD_DATABASE).forEach(key => {
      const dbCard = CARD_DATABASE[parseInt(key)];
      if (!newInventory[parseInt(key)]) {
        newInventory[parseInt(key)] = {
          cardIndex: parseInt(key),
          quantity: 99,
          rarity: dbCard.rarity || 'bronze',
          level: 1,
          skills: [],
          equipment: {}
        };
      } else {
        newInventory[parseInt(key)].quantity = 99;
      }
    });
    setInventory(newInventory);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const handleCardSelectForDeck = (dbId: number) => {
    if (selectedDeckSlot === null) return;
    const dbCard = CARD_DATABASE[dbId];
    if (!dbCard) return;

    // Make sure it's injected into inventory first
    const inv = { ...inventory };
    if (!inv[dbId]) {
      inv[dbId] = { cardIndex: dbId, quantity: 99, rarity: dbCard.rarity || 'bronze', level: 1, skills: [], equipment: {} };
      setInventory(inv);
    }
    
    // Check if duplicate in deck
    const isAlreadyInOtherSlot = currentDeck.some((c, idx) => idx !== selectedDeckSlot && c && c.imageIndex === dbId);
    if (isAlreadyInOtherSlot) {
      return;
    }

    const newDeck = [...currentDeck];
    newDeck[selectedDeckSlot] = {
      id: `custom-${dbId}-${Date.now()}`,
      imageIndex: dbId,
      title: dbCard.title,
      title_en: dbCard.title_en,
      title_dis: dbCard.title_dis,
      stats: [...dbCard.stats] as [number, number, number, number],
      rarity: dbCard.rarity || 'bronze',
      level: inv[dbId]?.level || 1,
      skills: inv[dbId]?.skills || [],
      equipment: inv[dbId]?.equipment || {}
    };

    setCurrentDeck(newDeck);
    setSelectedDeckSlot(null);
    playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
  };

  const resetAllCards = () => {
    if (isConfirmingReset) {
      setInventory({});
      setCurrentDeck(INITIAL_CARDS.slice(0, 5).map(c => syncCardWithDatabase(c, {})));
      setItemInventory([]);
      setStats(prev => ({ ...prev, skillPoints: 0, skillLevels: {} }));
      playSfx('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
      setIsConfirmingReset(false);
    } else {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 3000);
    }
  };

  const allDbCards = Object.keys(CARD_DATABASE).map(Number);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans px-3 py-4 sm:p-8 pb-32 overflow-x-hidden">
      <div className="max-w-4xl mx-auto mt-2 sm:mt-4 w-full">
        <PageHeader
          title="GOD MODE"
          onBack={() => onNavigate('home')}
          dark
          rightAction={
            <button
              onClick={() => { setShowHelp(true); setHelpStep(0); }}
              className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center hover:bg-white/10 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={14} className="text-slate-400" />
            </button>
          }
        />

        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={maxUpgradeAllCards}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-98 shadow-lg shadow-indigo-950/40 cursor-pointer text-sm"
          >
            <Zap size={16} /> 
            MAX ALL CARDS
          </button>
          <button 
            onClick={unlockAllCards}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-98 shadow-lg shadow-purple-950/40 cursor-pointer text-sm"
          >
            <Shield size={16} /> 
            UNLOCK & 99x ALL CARDS
          </button>
          <button 
            onClick={resetAllCards}
            className={`${isConfirmingReset ? 'bg-orange-600 hover:bg-orange-500' : 'bg-rose-600 hover:bg-rose-500'} text-white font-bold px-5 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-98 shadow-lg shadow-rose-950/40 cursor-pointer text-sm`}
          >
            <Trash2 size={16} /> 
            {isConfirmingReset ? (language === 'ko' ? '정말 초기화하시겠습니까?' : 'ARE YOU SURE?') : (language === 'ko' ? '카드/아이템 초기화' : 'RESET ALL CARDS & ITEMS')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-8">
          <div className="order-2 lg:order-1 bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl">
            <div className="space-y-3 sm:space-y-4">
              <input type="number" placeholder="WINS" className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 sm:p-3 rounded-xl font-bold text-white focus:border-yellow-450 outline-none transition-colors placeholder:text-slate-600" value={winsInput} onChange={e => setWinsInput(e.target.value)} />
              <input type="number" placeholder="LOSSES" className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 sm:p-3 rounded-xl font-bold text-white focus:border-yellow-450 outline-none transition-colors placeholder:text-slate-600" value={lossesInput} onChange={e => setLossesInput(e.target.value)} />
              <input type="number" placeholder="DRAWS" className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 sm:p-3 rounded-xl font-bold text-white focus:border-yellow-450 outline-none transition-colors placeholder:text-slate-600" value={drawsInput} onChange={e => setDrawsInput(e.target.value)} />
              <button onClick={handleStatsUpdate} className="w-full min-h-12 bg-yellow-450 hover:bg-yellow-400 text-slate-950 font-bold py-3 mt-1 sm:mt-2 rounded-xl sm:rounded-2xl transition-all active:scale-98 shadow-md text-xs uppercase tracking-wider cursor-pointer touch-target">APPLY STATS</button>
            </div>
          </div>

          <div className="order-1 lg:order-2 bg-slate-900/50 backdrop-blur-xs p-4 sm:p-6 border border-yellow-450/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-yellow-950/10">
            <div className="space-y-3 sm:space-y-4">
              <input type="number" placeholder="SNS" className="w-full bg-slate-950 border border-slate-800 px-3 py-3 sm:p-3 rounded-xl font-extrabold text-xl sm:text-2xl text-yellow-450 focus:border-yellow-450 outline-none transition-colors placeholder:text-slate-600" value={snsInput} onChange={e => setSnsInput(e.target.value)} />
              <button onClick={handleSnsUpdate} className="w-full min-h-12 bg-yellow-450 hover:bg-yellow-400 text-slate-950 font-bold py-3 mt-1 sm:mt-2 rounded-xl sm:rounded-2xl transition-all active:scale-98 shadow-md text-xs uppercase tracking-wider cursor-pointer touch-target">UPDATE SNS</button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xs p-6 border border-slate-800 rounded-3xl shadow-2xl">
          <div className="flex flex-wrap gap-4 mb-8 justify-center sm:justify-start">
            {currentDeck.map((card, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedDeckSlot(idx)}
                className={`relative w-24 h-36 border rounded-2xl flex items-center justify-center font-bold bg-slate-950 overflow-hidden ${selectedDeckSlot === idx ? 'border-yellow-455 ring-2 ring-yellow-455/35 scale-105 shadow-xl' : 'border-slate-850 hover:border-slate-700'} transition-all cursor-pointer`}
              >
                {card ? (
                  <>
                    <img src={`/assets/${card.imageIndex}.png`} alt={card.title} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <span className="relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center px-1 text-[10px] text-white font-extrabold">{card.title}</span>
                  </>
                ) : (
                  <span className="text-xs text-slate-600 font-bold uppercase">—</span>
                )}
              </button>
            ))}
          </div>

          {selectedDeckSlot !== null && (
            <div className="mt-8 border-t border-slate-800 pt-8">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {allDbCards.map(dbId => (
                  <button
                    key={dbId}
                    onClick={() => handleCardSelectForDeck(dbId)}
                    className="aspect-[5/7] border border-slate-800 hover:border-yellow-450 rounded-xl relative group overflow-hidden bg-slate-950 cursor-pointer transition-all"
                  >
                    <img src={`/assets/${dbId}.png`} alt="card" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xs p-6 border border-slate-800 rounded-3xl shadow-2xl mt-8">
          <div className="flex gap-4 overflow-x-auto pb-4 mb-8 snap-x custom-scrollbar">
            {(Object.values(inventory) as InventoryRecord[]).map(invCard => {
              const dbCard = CARD_DATABASE[invCard.cardIndex];
              if (!dbCard) return null;
              return (
                <button
                  key={invCard.cardIndex}
                  onClick={() => setSelectedCardToEdit(invCard.cardIndex)}
                  className={`flex-shrink-0 w-24 h-36 border rounded-2xl relative snap-start overflow-hidden bg-slate-950 ${selectedCardToEdit === invCard.cardIndex ? 'border-yellow-455 ring-2 ring-yellow-455/35 scale-105 shadow-xl' : 'border-slate-850 hover:border-slate-705'} transition-all cursor-pointer`}
                >
                  <img src={`/assets/${invCard.cardIndex}.png`} alt="card" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                  <div className="absolute inset-x-0 bottom-0 bg-slate-950/90 px-2 py-1.5 border-t border-slate-900">
                    <span className="text-[9px] font-bold block truncate text-slate-200">{dbCard.title}</span>
                    <span className="text-[9px] text-yellow-450 font-extrabold mt-0.5 block">Lv.{invCard.level || 1}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedCardToEdit !== null && inventory[selectedCardToEdit] && (
            <div className="border-t border-slate-800 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Level & Base Stats */}
                <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                  <div className="flex gap-2.5 pt-2">
                    <button 
                      onClick={() => {
                        const inv = {...inventory};
                        inv[selectedCardToEdit].level = Math.min(100, (inv[selectedCardToEdit].level || 1) + 1);
                        setInventory(inv);
                        // sync to deck if present
                        setCurrentDeck(prev => prev.map(c => c && c.imageIndex === selectedCardToEdit ? { ...c, level: inv[selectedCardToEdit].level } : c));
                      }}
                      className="bg-white/10 text-white hover:bg-white/15 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >+1 Level</button>
                    <button 
                      onClick={() => {
                        const inv = {...inventory};
                        inv[selectedCardToEdit].level = 100;
                        setInventory(inv);
                        setCurrentDeck(prev => prev.map(c => c && c.imageIndex === selectedCardToEdit ? { ...c, level: 100 } : c));
                      }}
                      className="bg-yellow-450 text-slate-950 hover:bg-yellow-400 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >MAX LEVEL (100)</button>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-slate-900 flex flex-col justify-between">
                  <button 
                    onClick={() => {
                      const inv = {...inventory};
                      inv[selectedCardToEdit].skills = INITIAL_SKILLS.map(s => ({ ...s, level: 100 }));
                      setInventory(inv);
                      setCurrentDeck(prev => prev.map(c => c && c.imageIndex === selectedCardToEdit ? { ...c, skills: inv[selectedCardToEdit].skills } : c));
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-950/20 cursor-pointer uppercase tracking-wider"
                  >
                    UNLOCK & MAX ALL SKILLS
                  </button>
                </div>

                {/* Items */}
                <div className="space-y-4 md:col-span-2 bg-slate-950/40 p-5 rounded-2xl border border-slate-900">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    {['necklace', 'boots', 'ring1', 'ring2'].map(slot => (
                      <div key={slot} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                        <select 
                          className="w-full bg-slate-900 border border-slate-800 text-xs p-2 rounded-lg text-slate-200 outline-none focus:border-slate-700"
                          value={inventory[selectedCardToEdit]?.equipment?.[slot as any]?.id || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const inv = {...inventory};
                            const eq = inv[selectedCardToEdit].equipment || {};
                            if (!val) {
                              delete eq[slot as any];
                            } else {
                              const tb = ITEM_DATABASE[parseInt(val)];
                              if (tb) {
                                eq[slot as any] = { ...tb, id: Math.random().toString(36).substring(2, 11) };
                              }
                            }
                            inv[selectedCardToEdit].equipment = eq;
                            setInventory(inv);
                            setCurrentDeck(prev => prev.map(c => {
                              if (c && c.imageIndex === selectedCardToEdit) {
                                const updated = { ...c, equipment: eq };
                                updated.power = getCardPower(updated);
                                return updated;
                              }
                              return c;
                            }));
                          }}
                        >
                          <option value="">—</option>
                          {ITEM_DATABASE.map((item, dbIdx) => {
                            if (item.slot === slot || (slot.startsWith('ring') && item.slot.startsWith('ring'))) {
                              return <option key={dbIdx} value={dbIdx.toString()}>{item.name_en}</option>;
                            }
                            return null;
                          })}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Popup */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[209] bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl border border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sticky top-0 z-10 bg-white pt-2">
                <h3 className="text-lg font-bold text-white">
                  GOD MODE
                </h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {helpSteps[helpStep]}
              </p>
              <div className="flex items-center justify-between">
                <button
                  disabled={helpStep === 0}
                  onClick={() => setHelpStep(helpStep - 1)}
                  className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} className="text-slate-400" />
                </button>
                <span className="text-xs text-slate-500 font-medium">
                  {helpStep + 1} / {helpSteps.length}
                </span>
                <button
                  disabled={helpStep === helpSteps.length - 1}
                  onClick={() => setHelpStep(helpStep + 1)}
                  className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} className="text-slate-400" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
