import React, { useState } from 'react';
import { Sparkles, Shield, X, Check, Zap, CreditCard, Award } from 'lucide-react';
import { EquipmentSlot, EquipmentItem } from '../types';
import { ItemIcon } from './ItemIcon';
import { cn } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { playSfx } from '../lib/sound';

interface GearStarterPackModalProps {
  slot: EquipmentSlot;
  cardName: string;
  cardIndex: number;
  season: string;
  language: string;
  snsBalance: number;
  onConsumeSns: (amount: number, reason: string) => boolean;
  onGrantAndEquipItem: (item: EquipmentItem, targetIndex: number, targetSlot: EquipmentSlot) => void;
  onClose: () => void;
}

interface StarterGearDef {
  name_ko: string;
  name_en: string;
  desc_ko: string;
  desc_en: string;
  imageIndex: number;
  stats: [number, number, number, number]; // N, E, S, W
  magicChance: number;
}

const STARTER_GEARS: Record<string, StarterGearDef> = {
  necklace: {
    name_ko: 'SSR 수호자의 드래곤 아뮬렛',
    name_en: "SSR Guardian's Dragon Amulet",
    desc_ko: '용의 가호가 깃들어 착용자의 방어력과 전체 스탯을 영구히 증폭시킵니다.',
    desc_en: 'Infused with dragon protection, greatly boosts all attributes and flip resilience.',
    imageIndex: 0,
    stats: [4, 3, 4, 3],
    magicChance: 15,
  },
  ring: {
    name_ko: 'SSR 아케인 마나 크리스탈 링',
    name_en: 'SSR Arcane Mana Crystal Ring',
    desc_ko: '고대 비전 마나가 농축되어 강력한 카드 타격력과 마법 발동률을 선사합니다.',
    desc_en: 'Concentrated arcane power granting superior attack power and magic trigger rate.',
    imageIndex: 1,
    stats: [5, 4, 2, 4],
    magicChance: 20,
  },
  ring1: {
    name_ko: 'SSR 아케인 마나 크리스탈 링',
    name_en: 'SSR Arcane Mana Crystal Ring',
    desc_ko: '고대 비전 마나가 농축되어 강력한 카드 타격력과 마법 발동률을 선사합니다.',
    desc_en: 'Concentrated arcane power granting superior attack power and magic trigger rate.',
    imageIndex: 1,
    stats: [5, 4, 2, 4],
    magicChance: 20,
  },
  ring2: {
    name_ko: 'SSR 아케인 마나 크리스탈 링',
    name_en: 'SSR Arcane Mana Crystal Ring',
    desc_ko: '고대 비전 마나가 농축되어 강력한 카드 타격력과 마법 발동률을 선사합니다.',
    desc_en: 'Concentrated arcane power granting superior attack power and magic trigger rate.',
    imageIndex: 1,
    stats: [5, 4, 2, 4],
    magicChance: 20,
  },
  boots: {
    name_ko: 'SSR 질풍의 헤르메스 윙 부츠',
    name_en: "SSR Hermes' Gale Winged Boots",
    desc_ko: '신속한 바람의 정령이 깃들어 선공 플립 주도권과 측면 전술을 강화합니다.',
    desc_en: 'Empowered with the spirit of wind for agile tactical flank superiority.',
    imageIndex: 2,
    stats: [3, 5, 3, 5],
    magicChance: 12,
  },
};

export const GearStarterPackModal: React.FC<GearStarterPackModalProps> = ({
  slot,
  cardName,
  cardIndex,
  season,
  language,
  snsBalance,
  onConsumeSns,
  onGrantAndEquipItem,
  onClose,
}) => {
  const isKo = language === 'ko';
  const gearDef = STARTER_GEARS[slot] || STARTER_GEARS['ring'];
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const createItem = (): EquipmentItem => {
    const uniqueId = `item_ssr_${slot}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const standardSlot: EquipmentSlot = (slot === 'ring1' || slot === 'ring2') ? 'ring' : slot;

    return {
      id: uniqueId,
      name_ko: gearDef.name_ko,
      name_en: gearDef.name_en,
      slot: standardSlot,
      rarity: 'rare', // SSR class
      stats: [...gearDef.stats],
      magicChance: gearDef.magicChance,
      imageIndex: gearDef.imageIndex,
      equippedToId: null,
    };
  };

  const handlePurchaseCash = () => {
    setIsProcessing(true);
    triggerHaptic('medium');

    setTimeout(() => {
      const newItem = createItem();
      onGrantAndEquipItem(newItem, cardIndex, slot);
      playSfx('reward');
      triggerHaptic('heavy');
      setPurchaseSuccess(true);
      setIsProcessing(false);

      setTimeout(() => {
        onClose();
      }, 1500);
    }, 700);
  };

  const handlePurchaseSns = () => {
    if (snsBalance < 120) {
      triggerHaptic('warning');
      alert(isKo ? 'SNS 포인트가 부족합니다. (120 SNS 필요)' : 'Not enough SNS. (120 SNS required)');
      return;
    }

    setIsProcessing(true);
    triggerHaptic('medium');

    const success = onConsumeSns(120, `SSR ${gearDef.name_ko} 스타터 팩 구매`);
    if (!success) {
      setIsProcessing(false);
      return;
    }

    setTimeout(() => {
      const newItem = createItem();
      onGrantAndEquipItem(newItem, cardIndex, slot);
      playSfx('reward');
      triggerHaptic('heavy');
      setPurchaseSuccess(true);
      setIsProcessing(false);

      setTimeout(() => {
        onClose();
      }, 1500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[10060] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-sm bg-[#151212] border-2 border-amber-400/80 rounded-2xl p-5 shadow-2xl text-white font-mono flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header Ribbon */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 rounded-xs bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
            1-TAP DIRECT
          </span>
          <span className="text-xs font-black text-amber-300">
            {isKo ? '슬롯 전용 SSR 스타터 팩' : 'SSR GEAR STARTER PACK'}
          </span>
        </div>

        {/* Gear Preview Card */}
        <div className="p-3.5 bg-gradient-to-b from-amber-950/30 to-slate-900/80 border border-amber-500/40 rounded-xl space-y-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)] shrink-0">
              <ItemIcon imageIndex={gearDef.imageIndex} size={42} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-xs bg-amber-400 text-black">
                  SSR
                </span>
                <span className="text-xs font-black text-white truncate">
                  {isKo ? gearDef.name_ko : gearDef.name_en}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                {isKo ? gearDef.desc_ko : gearDef.desc_en}
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-1 pt-1 border-t border-white/10 text-center">
            {['N', 'E', 'S', 'W'].map((dir, idx) => (
              <div key={dir} className="bg-slate-950/70 py-1 rounded border border-white/5">
                <span className="text-[9px] text-slate-500 font-bold block">{dir}</span>
                <span className="text-xs font-black text-emerald-400">+{gearDef.stats[idx]}</span>
              </div>
            ))}
          </div>

          {/* Special Ability */}
          <div className="p-2 bg-purple-950/40 border border-purple-500/30 rounded-lg flex items-center justify-between text-[10px]">
            <span className="text-purple-300 font-bold">
              {isKo ? '고유 패시브 (마법 발동 확률)' : 'Innate Magic Trigger'}
            </span>
            <span className="font-black text-purple-400">+{gearDef.magicChance}%</span>
          </div>

          {/* Auto Equip Target Note */}
          <div className="text-[10px] text-center text-amber-200/90 font-bold flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>
              {isKo
                ? `구매 즉시 [${cardName}] 슬롯에 자동 장착됩니다!`
                : `Instantly equipped to [${cardName}] upon purchase!`}
            </span>
          </div>
        </div>

        {/* Purchase Confirmation State */}
        {purchaseSuccess ? (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl text-center flex items-center justify-center gap-2 animate-in zoom-in-95">
            <Check size={18} className="text-emerald-400" />
            <span className="text-xs font-black">
              {isKo ? 'SSR 장비 획득 및 자동 장착 완료!' : 'SSR Gear Claimed & Auto-Equipped!'}
            </span>
          </div>
        ) : (
          /* Payment Actions */
          <div className="mt-4 space-y-2">
            {/* 1,200 KRW In-App Purchase */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePurchaseCash}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl text-xs font-black uppercase flex items-center justify-between active:scale-98 transition-all shadow-lg cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <CreditCard size={15} className="text-black" />
                <span>{isKo ? '즉시 확정 구매' : '1-Tap Purchase'}</span>
              </div>
              <span className="bg-black/80 text-amber-300 px-2 py-0.5 rounded-md text-[11px] font-black">
                ₩1,200
              </span>
            </button>

            {/* 120 SNS Point Exchange */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handlePurchaseSns}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-amber-400/40 text-white rounded-xl text-xs font-bold flex items-center justify-between active:scale-98 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" />
                <span>{isKo ? '보유 SNS 포인트로 교환' : 'Pay with SNS Points'}</span>
              </div>
              <span className="text-amber-300 font-black flex items-center gap-1 text-[11px]">
                <span>120 SNS</span>
                <span className="text-[9px] text-slate-400 font-normal">
                  ({isKo ? `보유: ${snsBalance}` : `Own: ${snsBalance}`})
                </span>
              </span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-3 text-center text-[9px] text-slate-500">
          {isKo
            ? '💡 구매한 장비는 영구 소장되며 마이덱 인벤토리 및 로컬스토리지에 저장됩니다.'
            : '💡 Purchased gear is permanently stored in your deck inventory and localStorage.'}
        </div>
      </div>
    </div>
  );
};
