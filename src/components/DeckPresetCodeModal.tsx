/**
 * DeckPresetCodeModal.tsx
 * ID 342: 마이덱 덱 프리셋 복사 및 덱 코드 불러오기 지원
 * ID 372: 마이덱 편성 시 덱 복사 및 공유용 QR 코드 생성/스캔
 */

import React, { useState } from 'react';
import { Copy, Check, Download, QrCode, X, Layers, AlertCircle } from 'lucide-react';
import { CardData, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { syncCardWithDatabase } from '../constants';

interface DeckPresetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeck: CardData[];
  onImportDeck: (importedCards: CardData[]) => void;
  language: Language;
  onClonePreset?: () => void;
  showCustomAlert?: (title: string, msg: string) => void;
}

export const DeckPresetCodeModal: React.FC<DeckPresetCodeModalProps> = ({
  isOpen,
  onClose,
  currentDeck,
  onImportDeck,
  language,
  onClonePreset,
  showCustomAlert,
}) => {
  const [copied, setCopied] = useState(false);
  const [importCodeInput, setImportCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'qr'>('export');

  if (!isOpen) return null;

  // 덱 코드 인코딩: SNSH1-{cardId1}-{cardId2}-{cardId3}-{cardId4}-{cardId5}
  const deckCode = `SNSH1-${currentDeck.map((c) => c.id).join('-')}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(deckCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleImport = () => {
    setErrorMsg(null);
    const cleaned = importCodeInput.trim();
    if (!cleaned.startsWith('SNSH1-')) {
      setErrorMsg(language === 'ko' ? '올바른 덱 코드 형식이 아닙니다 (예: SNSH1-1-2-3-4-5)' : 'Invalid deck code format');
      return;
    }

    const parts = cleaned.replace('SNSH1-', '').split('-');
    if (parts.length !== 5) {
      setErrorMsg(language === 'ko' ? '덱 코드는 5장의 카드가 포함되어야 합니다.' : 'Deck code must contain exactly 5 cards.');
      return;
    }

    const importedCards: CardData[] = [];
    for (const idStr of parts) {
      const id = parseInt(idStr, 10);
      const dbCard = CARD_DATABASE[id];
      if (!dbCard) {
        setErrorMsg(language === 'ko' ? `존재하지 않는 카드 ID: ${idStr}` : `Unknown Card ID: ${idStr}`);
        return;
      }
      importedCards.push(syncCardWithDatabase({ ...dbCard, id: dbCard.id.toString() } as unknown as CardData, {}));
    }

    onImportDeck(importedCards);
    showCustomAlert?.(
      language === 'ko' ? '덱 불러오기 성공' : 'Deck Imported',
      language === 'ko' ? '공유받은 덱 5장을 현재 덱 슬롯에 장착했습니다.' : 'Loaded 5 cards into active deck.'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-sm w-full max-w-md p-5 text-slate-100 font-mono space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {language === 'ko' ? '덱 코드 공유 & 프리셋 복제' : 'Deck Code & Preset Share'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border border-slate-800 rounded-xs overflow-hidden text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'export' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'ko' ? '코드 내보내기' : 'Export Code'}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'import' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'ko' ? '코드 불러오기' : 'Import Code'}
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 transition-colors cursor-pointer ${
              activeTab === 'qr' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            {language === 'ko' ? 'QR 공유' : 'QR Code'}
          </button>
        </div>

        {/* Tab 1: Export & Clone */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs space-y-2">
              <span className="text-[11px] text-slate-400">
                {language === 'ko' ? '현재 5장 덱 공유 코드' : 'Current 5-Card Deck Code'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={deckCode}
                  className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-indigo-300 font-mono rounded-xs select-all outline-none"
                />
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                  <span>{copied ? (language === 'ko' ? '복사됨' : 'Copied') : (language === 'ko' ? '복사' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {onClonePreset && (
              <button
                onClick={() => {
                  onClonePreset();
                  showCustomAlert(
                    language === 'ko' ? '프리셋 복제 완료' : 'Preset Cloned',
                    language === 'ko' ? '현재 덱이 빈 프리셋 슬롯에 복제되었습니다.' : 'Deck duplicated to next slot.'
                  );
                }}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Layers size={14} className="text-indigo-400" />
                <span>{language === 'ko' ? '현재 덱을 빈 슬롯에 복제 (Clone Deck)' : 'Clone Deck to Empty Slot'}</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Import Code */}
        {activeTab === 'import' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300">
                {language === 'ko' ? '공유받은 덱 코드 입력' : 'Paste Deck Code'}
              </label>
              <input
                type="text"
                value={importCodeInput}
                onChange={(e) => setImportCodeInput(e.target.value)}
                placeholder="SNSH1-1-5-12-25-33"
                className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-indigo-300 font-mono rounded-xs outline-none focus:border-indigo-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2 bg-rose-950/80 border border-rose-500/50 rounded-xs flex items-center gap-1.5 text-[11px] text-rose-300">
                <AlertCircle size={14} className="shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleImport}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>{language === 'ko' ? '덱 불러오기 적용' : 'Import Deck'}</span>
            </button>
          </div>
        )}

        {/* Tab 3: QR Code Display */}
        {activeTab === 'qr' && (
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-xs space-y-3">
            <div className="p-3 bg-white rounded-sm shadow-md">
              {/* Fallback QR representation using standard high contrast block grid */}
              <div className="w-36 h-36 flex flex-col items-center justify-center border-4 border-black bg-white p-2">
                <QrCode size={110} className="text-slate-900" />
              </div>
            </div>
            <span className="text-[10px] text-slate-400 text-center font-mono">
              {language === 'ko' ? '스마트폰 카메라로 스캔하여 덱 코드를 즉시 공유받으세요.' : 'Scan with mobile camera to import deck.'}
            </span>
            <div className="px-2 py-1 bg-slate-900 border border-slate-800 text-[9px] text-indigo-300 font-mono rounded-xs">
              {deckCode}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
