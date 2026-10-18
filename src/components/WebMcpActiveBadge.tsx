/**
 * WebMcpActiveBadge.tsx
 * Subtle floating badge displaying WebMCP active tool status.
 * Following DESIGN.md Monospace styling.
 */

import React, { useState } from 'react';
import { useWebMcpState } from '../lib/webMcp/index';
import { WebMcpInspectorModal } from './WebMcpInspectorModal';

interface WebMcpActiveBadgeProps {
 currentScreen?: string;
}

export const WebMcpActiveBadge: React.FC<WebMcpActiveBadgeProps> = ({ currentScreen }) => {
 const { toolCount } = useWebMcpState();
 const [isInspectorOpen, setIsInspectorOpen] = useState(false);

 return (
 <>
 <div className="fixed bottom-2 left-2 z-[9990] select-none font-mono">
 <button
 onClick={() => setIsInspectorOpen(true)}
 className="min-h-[44px] flex items-center gap-1.5 px-2.5 py-1 bg-[#201d1d]/90 hover:bg-[#201d1d] text-[#fdfcfc] text-[10px] font-bold border border-[rgba(255,255,255,0.18)] shadow-none transition-all active:scale-95 cursor-pointer backdrop-blur-xs"
 title="Click to open WebMCP Live Tool Inspector & Test Console"
 >
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
 <span>[⚡ WebMCP: {toolCount}]</span>
 </button>
 </div>

 <WebMcpInspectorModal
 isOpen={isInspectorOpen}
 onClose={() => setIsInspectorOpen(false)}
 currentScreen={currentScreen}
 />
 </>
 );
};

export default WebMcpActiveBadge;
