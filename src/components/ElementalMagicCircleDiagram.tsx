/**
 * ElementalMagicCircleDiagram.tsx - SCR-03-26
 * 5장 덱의 5대 상성 속성 간 상호작용 및 방어 취약점을 한눈에 보여주는 '매직 서클 상성 다이어그램(48px 탭)'
 * 취약점 발생 시 붉은 펄스 경고와 대체 카드를 제안하는 인스펙터 UX 구축.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Sparkles, CheckCircle2, ChevronRight, X, RefreshCw } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface DeckElementInfo {
  fire: number;
  water: number;
  earth: number;
  wind: number;
  light: number;
}

interface ElementalMagicCircleDiagramProps {
  elementCounts: DeckElementInfo;
  onSelectSubstituteCard?: (element: string) => void;
}

interface ElementNode {
  id: keyof DeckElementInfo;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  weakTo: string;
  strongAgainst: string;
  x: number;
  y: number;
}

export const ElementalMagicCircleDiagram: React.FC<ElementalMagicCircleDiagramProps> = ({
  elementCounts,
  onSelectSubstituteCard,
}) => {
  const [selectedElement, setSelectedElement] = useState<keyof DeckElementInfo | null>(null);

  // 5 Nodes positioned on a circle (radius 75px around center 100, 100)
  const nodes: ElementNode[] = [
    { id: 'fire', name: '화염', icon: '🔥', color: '#ef4444', bgColor: 'bg-red-950/60', weakTo: '물(수)', strongAgainst: '바람(풍)', x: 100, y: 25 },
    { id: 'wind', name: '바람', icon: '🌪️', color: '#10b981', bgColor: 'bg-emerald-950/60', weakTo: '화염(화)', strongAgainst: '대지(지)', x: 172, y: 76 },
    { id: 'earth', name: '대지', icon: '⛰️', color: '#f59e0b', bgColor: 'bg-amber-950/60', weakTo: '바람(풍)', strongAgainst: '빛(광)', x: 145, y: 160 },
    { id: 'light', name: '빛', icon: '⚡', color: '#eab308', bgColor: 'bg-yellow-950/60', weakTo: '대지(지)', strongAgainst: '물(수)', x: 55, y: 160 },
    { id: 'water', name: '물', icon: '💧', color: '#06b6d4', bgColor: 'bg-cyan-950/60', weakTo: '빛(광)', strongAgainst: '화염(화)', x: 28, y: 76 },
  ];

  // Detect vulnerable / missing element (count == 0)
  const missingElements = nodes.filter((n) => elementCounts[n.id] === 0);
  const isVulnerable = missingElements.length >= 2;

  const handleNodeClick = (id: keyof DeckElementInfo) => {
    triggerHaptic('light');
    setSelectedElement((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono select-none flex flex-col items-center shadow-lg">
      {/* Header with vulnerability badge */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-400" />
          <span className="text-xs font-black text-slate-200">[ 덱 상성 매직 서클 ]</span>
        </div>
        {isVulnerable ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-[10px] text-rose-400 font-bold animate-pulse">
            <ShieldAlert size={12} />
            <span>방어 취약점 감지 ({missingElements.length}개 속성 결여)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] text-emerald-400 font-bold">
            <CheckCircle2 size={12} />
            <span>균형 잡힌 상성</span>
          </div>
        )}
      </div>

      {/* Interactive Magic Circle Canvas Area */}
      <div className="relative w-52 h-52 flex items-center justify-center my-1">
        {/* SVG connection pentagram lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 200 200">
          <polygon
            points="100,25 172,76 145,160 55,160 28,76"
            fill="rgba(30, 41, 59, 0.25)"
            stroke="rgba(148, 163, 184, 0.25)"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          {/* Inner pentagram star lines */}
          <polygon
            points="100,25 145,160 28,76 172,76 55,160"
            fill="none"
            stroke="rgba(234, 179, 8, 0.3)"
            strokeWidth="1"
          />
        </svg>

        {/* Center core pulse */}
        <div className="absolute w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] font-black text-amber-300">
          5 ELEMENT
        </div>

        {/* 5 Element Touch Nodes (48px targets) */}
        {nodes.map((node) => {
          const count = elementCounts[node.id];
          const isSelected = selectedElement === node.id;
          const isMissing = count === 0;

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => handleNodeClick(node.id)}
              style={{
                left: `${node.x - 24}px`,
                top: `${node.y - 24}px`,
              }}
              className={`absolute w-12 h-12 rounded-full flex flex-col items-center justify-center cursor-pointer transition-all active:scale-90 border-2 shadow-md ${
                isSelected
                  ? 'border-white scale-110 z-20'
                  : isMissing
                  ? 'border-rose-500/70 bg-rose-950/40 animate-pulse z-10'
                  : 'border-slate-700 bg-slate-900/90 hover:border-slate-500 z-10'
              }`}
            >
              <span className="text-sm">{node.icon}</span>
              <span
                className={`text-[9px] font-black ${
                  isMissing ? 'text-rose-400' : 'text-slate-200'
                }`}
              >
                {count}장
              </span>
            </button>
          );
        })}
      </div>

      {/* Node Inspector Details Panel */}
      <AnimatePresence mode="wait">
        {selectedElement && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="w-full mt-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-left text-xs space-y-2"
          >
            {(() => {
              const activeNode = nodes.find((n) => n.id === selectedElement);
              if (!activeNode) return null;
              const count = elementCounts[activeNode.id];
              const isMissing = count === 0;

              return (
                <>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white flex items-center gap-1">
                      {activeNode.icon} {activeNode.name} 속성 ({count}장 편성됨)
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedElement(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-1.5 bg-emerald-950/30 border border-emerald-500/30 rounded text-emerald-300">
                      ⚡ 강세: {activeNode.strongAgainst} 카운터
                    </div>
                    <div className="p-1.5 bg-rose-950/30 border border-rose-500/30 rounded text-rose-300">
                      ⚠️ 약점: {activeNode.weakTo}에 취약
                    </div>
                  </div>
                  {isMissing && (
                    <div className="pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-amber-300">
                        {activeNode.name} 속성 대체 카드로 덱 밸런스를 보강하세요.
                      </span>
                      {onSelectSubstituteCard && (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('medium');
                            onSelectSubstituteCard(activeNode.id);
                          }}
                          className="px-2 py-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <RefreshCw size={10} />
                          <span>대체 카드 추천</span>
                        </button>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
