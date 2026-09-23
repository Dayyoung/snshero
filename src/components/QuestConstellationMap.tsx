/**
 * QuestConstellationMap.tsx - SCR-11-14
 * 연계 퀘스트 트리를 별자리(Constellation) 마인드맵 형태로 시각화하는 핀치 줌 뷰어
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, Lock, Star, ChevronRight, X } from 'lucide-react';
import { triggerHaptic } from '../lib/haptic';

export interface ConstellationNode {
  id: string;
  title: string;
  status: 'completed' | 'active' | 'locked';
  x: number; // 0-100%
  y: number; // 0-100%
  connectedTo?: string[];
}

interface QuestConstellationMapProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: ConstellationNode[];
  onSelectNode: (node: ConstellationNode) => void;
}

export const QuestConstellationMap: React.FC<QuestConstellationMapProps> = ({
  isOpen,
  onClose,
  nodes,
  onSelectNode,
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col font-mono select-none">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-400" size={18} />
          <h3 className="text-sm font-black text-white">퀘스트 별자리(Constellation) 마인드맵</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Map Stage */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-black">
        {/* SVG Constellation lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {nodes.map(node => {
            if (!node.connectedTo) return null;
            return node.connectedTo.map(targetId => {
              const target = nodes.find(n => n.id === targetId);
              if (!target) return null;
              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${target.x}%`}
                  y2={`${target.y}%`}
                  stroke={node.status === 'completed' ? '#38bdf8' : '#334155'}
                  strokeWidth="2"
                  strokeDasharray={node.status === 'completed' ? 'none' : '4 4'}
                />
              );
            });
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const isCompleted = node.status === 'completed';
          const isActive = node.status === 'active';

          return (
            <motion.div
              key={node.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('medium');
                onSelectNode(node);
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer flex flex-col items-center"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-lg transition-all ${
                  isCompleted
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-cyan-500/30'
                    : isActive
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse shadow-amber-500/30'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : isActive ? <Star size={18} /> : <Lock size={16} />}
              </div>
              <span className="text-[10px] text-white font-bold bg-black/80 px-2 py-0.5 rounded-full mt-1 whitespace-nowrap border border-slate-800">
                {node.title}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-[11px] text-slate-400">
        별자리 노드를 탭하여 선행 퀘스트 요구 조건과 보상을 확인하세요.
      </div>
    </div>
  );
};
