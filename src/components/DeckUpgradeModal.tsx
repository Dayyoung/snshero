import React from 'react';
import { CARD_DATABASE } from '../cardDatabase';
import { t } from '../lib/i18n';
import { getFormattedCardName } from '../lib/utils';
import type { Language } from '../types';

interface UpgradeMapping {
  idx: number;
  imgIdx: number;
}

interface DeckUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language: Language;
  upgradedCards: UpgradeMapping[];
  currentDeck: (any | null)[];
}

export const DeckUpgradeModal: React.FC<DeckUpgradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  language,
  upgradedCards,
  currentDeck,
}) => {
  if (!isOpen || upgradedCards.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-mono text-[#201d1d] animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-none shadow-xl p-4 sm:p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] pb-3 bg-[#f8f7f7] -mx-4 -mt-4 p-3.5 sm:-mx-5 sm:-mt-5 sm:p-4">
          <div>
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-tight text-[#201d1d]">
              [{t('deck_upgrade_available', language)}]
            </h2>
            <p className="text-[10px] text-[#646262] mt-0.5">
              {t('upgrade_deck_confirm', language)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-1 text-[#646262] hover:text-[#201d1d] font-bold text-xs cursor-pointer border border-[rgba(15,0,0,0.12)] rounded-sm hover:bg-[#e2e0e0] transition-colors"
          >
            [✕]
          </button>
        </div>

        {/* 1-line Summary Banner */}
        <div className="px-3 py-1.5 bg-[#f8f7f7] border border-[rgba(15,0,0,0.12)] rounded-sm flex items-center justify-between text-[11px] font-bold">
          <span className="text-[#646262]">
            {language === 'ko' ? `교체 대상: ${upgradedCards.length}장` : `Upgrades: ${upgradedCards.length}`}
          </span>
          <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-sm">
            [+] AUTO REPLACEMENT
          </span>
        </div>

        {/* Cards Comparison List */}
        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-0.5">
          {upgradedCards.map((mapping, idx) => {
            const currentCard = currentDeck[mapping.idx];
            const currentCardImgIdx = currentCard?.imageIndex || 0;
            const currentDb = CARD_DATABASE[currentCardImgIdx];
            const currentName = currentDb ? getFormattedCardName(currentDb, language) : `Slot ${mapping.idx + 1}`;
            const currentPower = currentCard ? (currentCard.power || currentDb?.power || 0) : 0;
            const currentRarity = currentCard?.rarity || 'bronze';

            const newDb = CARD_DATABASE[mapping.imgIdx];
            const newName = newDb ? getFormattedCardName(newDb, language) : `New Card`;
            const newPower = newDb ? newDb.power : 0;
            const newRarity = newDb ? newDb.rarity : 'bronze';

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] rounded-sm text-xs"
              >
                {/* Current Card */}
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase text-[#646262] block">
                    Slot {mapping.idx + 1}
                  </span>
                  <div className="text-[11px] font-bold text-[#646262] truncate">
                    {currentName}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-[9px]">
                    <span className="border border-[rgba(15,0,0,0.12)] px-1 py-0.2 rounded-xs uppercase">
                      {currentRarity}
                    </span>
                    <span className="text-rose-700 font-bold">
                      {currentPower}
                    </span>
                  </div>
                </div>

                {/* Arrow Marker */}
                <div className="px-2 text-[#201d1d] font-black text-sm shrink-0">
                  ➔
                </div>

                {/* New Card */}
                <div className="flex-1 min-w-0 text-right">
                  <span className="text-[9px] uppercase font-bold text-indigo-700 block">
                    [UPGRADE]
                  </span>
                  <div className="text-[11px] font-bold text-[#201d1d] truncate">
                    {newName}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-0.5 text-[9px]">
                    <span className="bg-[#201d1d] text-[#fdfcfc] px-1 py-0.2 rounded-xs uppercase">
                      {newRarity}
                    </span>
                    <span className="text-emerald-700 font-bold">
                      {newPower}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-[rgba(15,0,0,0.12)]">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-sm border border-[rgba(15,0,0,0.12)] bg-[#fdfcfc] text-[#646262] hover:text-[#201d1d] hover:bg-[#f8f7f7] font-bold text-xs cursor-pointer transition-colors active:scale-95"
          >
            [{t('no', language)}]
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-sm border border-[#201d1d] bg-[#201d1d] text-[#fdfcfc] hover:bg-[#333030] font-bold text-xs cursor-pointer transition-colors active:scale-95"
          >
            [{t('yes', language)}]
          </button>
        </div>
      </div>
    </div>
  );
};
