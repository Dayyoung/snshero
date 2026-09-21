/**
 * ModularWidgetDock.tsx - SCR-01-14
 * 100dvh 모바일 엄지 영역에 맞춘 커스텀 모듈러 위젯 독
 */

import React, { useState, useEffect } from 'react';
import { ViewType, Language } from '../types';
import { triggerHaptic } from '../lib/haptic';
import { Swords, ShoppingBag, BookOpen, Trophy, Sparkles, Sliders } from 'lucide-react';

interface ModularWidgetDockProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
}

interface WidgetItem {
  id: string;
  view: ViewType;
  labelKo: string;
  labelEn: string;
  icon: React.ReactNode;
}

const DEFAULT_WIDGETS: WidgetItem[] = [
  { id: 'arena', view: 'game', labelKo: '아레나', labelEn: 'Arena', icon: <Swords size={18} /> },
  { id: 'shop', view: 'shop', labelKo: '상점', labelEn: 'Shop', icon: <ShoppingBag size={18} /> },
  { id: 'deck', view: 'mydeck', labelKo: '마이덱', labelEn: 'My Deck', icon: <BookOpen size={18} /> },
  { id: 'rank', view: 'ranking', labelKo: '랭킹', labelEn: 'Rank', icon: <Trophy size={18} /> },
];

export const ModularWidgetDock: React.FC<ModularWidgetDockProps> = ({ language, onNavigate }) => {
  const [widgets] = useState<WidgetItem[]>(() => {
    try {
      const saved = localStorage.getItem('hero_modular_dock_order');
      if (saved) {
        const orderIds: string[] = JSON.parse(saved);
        return orderIds
          .map((id) => DEFAULT_WIDGETS.find((w) => w.id === id))
          .filter(Boolean) as WidgetItem[];
      }
    } catch {}
    return DEFAULT_WIDGETS;
  });

  return (
    <div className="w-full max-w-md mx-auto px-3 py-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-lg shadow-xl flex items-center justify-around font-mono select-none">
      {widgets.map((widget) => (
        <button
          key={widget.id}
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onNavigate(widget.view);
          }}
          className="flex flex-col items-center justify-center p-2 rounded hover:bg-white/10 active:scale-95 transition-all text-slate-300 hover:text-white cursor-pointer min-w-[56px]"
        >
          <div className="text-amber-400 mb-0.5">{widget.icon}</div>
          <span className="text-[10px] font-bold">
            {language === 'ko' ? widget.labelKo : widget.labelEn}
          </span>
        </button>
      ))}
    </div>
  );
};
