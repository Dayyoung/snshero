/**
 * WebMcpInspectorModal.tsx
 * Visual Inspector & Test Console for WebMCP (Chrome 149+ AI Model Context Protocol)
 * Designed following DESIGN.md Monospace flat ink styling.
 */

import React, { useState } from 'react';
import { X, Play, RefreshCw, Terminal, Layers, Shield, Clock, Check, AlertCircle } from 'lucide-react';
import { useWebMcpState } from '../lib/webMcp/index';
import { cn } from '../lib/utils';

interface WebMcpInspectorModalProps {
 isOpen: boolean;
 onClose: () => void;
 currentScreen?: string;
}

export const WebMcpInspectorModal: React.FC<WebMcpInspectorModalProps> = ({
 isOpen,
 onClose,
 currentScreen
}) => {
 const { tools, toolCount, logs, executeTool } = useWebMcpState();
 const [activeTab, setActiveTab] = useState<'tools' | 'logs' | 'guide'>('tools');
 const [selectedToolName, setSelectedToolName] = useState<string | null>(null);
 const [testParamsInput, setTestParamsInput] = useState<string>('{}');
 const [testResult, setTestResult] = useState<any>(null);
 const [isExecuting, setIsExecuting] = useState(false);
 const [executionError, setExecutionError] = useState<string | null>(null);

 if (!isOpen) return null;

 const selectedTool = tools.find(t => t.name === selectedToolName);

 const handleSelectTool = (tool: any) => {
 setSelectedToolName(tool.name);
 setTestResult(null);
 setExecutionError(null);

 // Generate sample parameters from JSON schema
 const sample: Record<string, any> = {};
 if (tool.inputSchema?.properties) {
 for (const [key, prop] of Object.entries<any>(tool.inputSchema.properties)) {
 if (prop.default !== undefined) {
 sample[key] = prop.default;
 } else if (prop.enum && prop.enum.length > 0) {
 sample[key] = prop.enum[0];
 } else if (prop.type === 'string') {
 sample[key] = 'sample';
 } else if (prop.type === 'number' || prop.type === 'integer') {
 sample[key] = 1;
 } else if (prop.type === 'boolean') {
 sample[key] = true;
 }
 }
 }
 setTestParamsInput(JSON.stringify(sample, null, 2));
 };

 const handleRunTool = async () => {
 if (!selectedTool) return;
 setIsExecuting(true);
 setExecutionError(null);
 setTestResult(null);

 try {
 let parsed = {};
 try {
 parsed = JSON.parse(testParamsInput);
 } catch (err: any) {
 throw new Error(`Invalid JSON syntax in parameters: ${err.message}`);
 }

 const res = await executeTool(selectedTool.name, parsed);
 setTestResult(res);
 } catch (err: any) {
 setExecutionError(err?.message || String(err));
 } finally {
 setIsExecuting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[10006] flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-xs font-mono text-xs select-none">
 <div className="bg-[#fdfcfc] text-[#201d1d] border border-[rgba(15,0,0,0.18)] rounded-none shadow-none w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(15,0,0,0.12)] bg-[#f4f3f1]">
 <div className="flex items-center gap-2">
 <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full transition-opacity duration-300" />
 <span className="font-black text-sm tracking-tight">[⚡ WebMCP Live Console]</span>
 <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 font-bold">
 Active Screen: {currentScreen || 'GLOBAL'}
 </span>
 <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold">
 {toolCount} Tools Exposed
 </span>
 </div>
 <button
 onClick={onClose}
 className="min-h-[44px] p-1 text-slate-500 hover:text-slate-900 border border-transparent hover:border-slate-300 transition"
 >
 <X size={16} />
 </button>
 </div>

 {/* Tab Navigation */}
 <div className="flex items-center border-b border-[rgba(15,0,0,0.12)] bg-slate-50 px-4">
 <button
 onClick={() => setActiveTab('tools')}
 className={cn("min-h-[44px]", 
 'px-4 py-2.5 font-bold border-b-2 transition cursor-pointer',
 activeTab === 'tools'
 ? 'border-slate-900 text-slate-900 bg-white'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 )}
 >
 [1. Registered Tools ({toolCount})]
 </button>
 <button
 onClick={() => setActiveTab('logs')}
 className={cn("min-h-[44px]", 
 'px-4 py-2.5 font-bold border-b-2 transition cursor-pointer',
 activeTab === 'logs'
 ? 'border-slate-900 text-slate-900 bg-white'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 )}
 >
 [2. Execution Logs ({logs.length})]
 </button>
 <button
 onClick={() => setActiveTab('guide')}
 className={cn("min-h-[44px]", 
 'px-4 py-2.5 font-bold border-b-2 transition cursor-pointer',
 activeTab === 'guide'
 ? 'border-slate-900 text-slate-900 bg-white'
 : 'border-transparent text-slate-500 hover:text-slate-800'
 )}
 >
 [3. AI Agent Spec & Guide]
 </button>
 </div>

 {/* Body Content */}
 <div className="flex-1 overflow-hidden p-4">
 {activeTab === 'tools' && (
 <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full max-h-[65vh]">
 {/* Tool List Sidebar */}
 <div className="md:col-span-5 border border-slate-200 overflow-y-auto space-y-1 p-1 bg-white">
 {tools.map((tool) => {
 const isSelected = selectedToolName === tool.name;
 return (
 <button
 key={tool.name}
 onClick={() => handleSelectTool(tool)}
 className={cn("min-h-[44px]", 
 'w-full text-left p-2.5 border transition cursor-pointer',
 isSelected
 ? 'border-slate-900 bg-slate-100 font-bold'
 : 'border-transparent hover:bg-slate-50 text-slate-700'
 )}
 >
 <div className="flex items-center justify-between gap-1">
 <span className="font-black text-slate-900 truncate">
 ⚡ {tool.name}
 </span>
 {tool.annotations?.readOnlyHint ? (
 <span className="text-[9px] bg-blue-100 text-blue-800 px-1 py-0.2 shrink-0">
 READ
 </span>
 ) : (
 <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 shrink-0">
 ACTION
 </span>
 )}
 </div>
 <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-mono">
 {tool.description}
 </p>
 </button>
 );
 })}
 </div>

 {/* Tool Detail & Test Console */}
 <div className="md:col-span-7 border border-slate-200 p-3 overflow-y-auto bg-white flex flex-col gap-3">
 {selectedTool ? (
 <>
 <div className="space-y-1 border-b pb-2">
 <div className="flex items-center gap-2">
 <span className="text-base font-black text-slate-900">
 {selectedTool.name}
 </span>
 {selectedTool.category && (
 <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5">
 {selectedTool.category}
 </span>
 )}
 </div>
 <p className="text-xs text-slate-600 font-mono leading-relaxed">
 {selectedTool.description}
 </p>
 </div>

 {/* Annotations */}
 <div className="flex flex-wrap gap-2 text-[10px]">
 <span className="text-slate-500">Hints:</span>
 <span className={cn('px-1.5 py-0.5 border', selectedTool.annotations?.readOnlyHint ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500')}>
 readOnly: {String(selectedTool.annotations?.readOnlyHint ?? false)}
 </span>
 <span className={cn('px-1.5 py-0.5 border', selectedTool.annotations?.consequentialHint ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500')}>
 consequential: {String(selectedTool.annotations?.consequentialHint ?? false)}
 </span>
 </div>

 {/* Test Parameters Input */}
 <div className="space-y-1">
 <label className="text-[11px] font-bold text-slate-700 block">
 [Test Input Parameters (JSON)]
 </label>
 <textarea
 rows={4}
 value={testParamsInput}
 onChange={(e) => setTestParamsInput(e.target.value)}
 className="w-full p-2 border border-slate-300 font-mono text-[11px] focus:outline-none focus:border-slate-800 bg-slate-50"
 />
 </div>

 <button
 onClick={handleRunTool}
 disabled={isExecuting}
 className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
 >
 {isExecuting ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
 <span>{isExecuting ? 'Executing...' : 'Execute Tool Now'}</span>
 </button>

 {/* Execution Output */}
 {executionError && (
 <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-800 text-[11px]">
 <div className="font-bold flex items-center gap-1.5 mb-1">
 <AlertCircle size={14} /> Execution Error:
 </div>
 <pre className="whitespace-pre-wrap">{executionError}</pre>
 </div>
 )}

 {testResult && (
 <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 text-[11px]">
 <div className="font-bold flex items-center gap-1.5 mb-1">
 <Check size={14} /> Result Output:
 </div>
 <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px] max-h-40">
 {JSON.stringify(testResult, null, 2)}
 </pre>
 </div>
 )}
 </>
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-16">
 <Terminal size={32} className="mb-2 opacity-50" />
 <span>Select a registered tool on the left to inspect or test.</span>
 </div>
 )}
 </div>
 </div>
 )}

 {activeTab === 'logs' && (
 <div className="h-full max-h-[65vh] overflow-y-auto space-y-2">
 {logs.length === 0 ? (
 <div className="text-center py-16 text-slate-400">
 No execution logs yet. Test run a tool or wait for AI Agent actions.
 </div>
 ) : (
 logs.map((log) => (
 <div key={log.id} className="p-3 border border-slate-200 bg-white space-y-1 text-[11px]">
 <div className="flex items-center justify-between">
 <span className="font-black text-slate-900">⚡ {log.toolName}</span>
 <span className="text-[10px] text-slate-500">
 {log.durationMs}ms | {new Date(log.timestamp).toLocaleTimeString()}
 </span>
 </div>
 {log.error ? (
 <p className="text-rose-600 font-bold">Error: {log.error}</p>
 ) : (
 <pre className="text-[10px] text-slate-600 bg-slate-50 p-2 overflow-x-auto max-h-24">
 {JSON.stringify(log.result, null, 2)}
 </pre>
 )}
 </div>
 ))
 )}
 </div>
 )}

 {activeTab === 'guide' && (
 <div className="h-full max-h-[65vh] overflow-y-auto space-y-3 text-slate-700 leading-relaxed p-2">
 <div className="p-3 bg-blue-50 border border-blue-200">
 <h4 className="font-bold text-blue-900 text-xs mb-1">[Google Chrome WebMCP W3C Standard]</h4>
 <p className="text-[11px] text-blue-800">
 WebMCP allows AI browser agents (Chrome Gemini, Model Context Tool Inspector, Puppeteer) to operate SNSHero entirely through standard tool calls without any manual user prompts or guidance.
 </p>
 </div>

 <div className="space-y-1">
 <span className="font-bold block">[Chrome 149+ Flag Enablement]:</span>
 <p className="text-[11px] text-slate-600">
 1. Visit <code className="bg-slate-100 px-1 py-0.5">chrome://flags/#enable-webmcp-testing</code><br />
 2. Set to <strong>Enabled</strong> and relaunch Chrome.
 </p>
 </div>

 <div className="space-y-1">
 <span className="font-bold block">[JavaScript Console Invocation Sample]:</span>
 <pre className="p-2 bg-slate-900 text-emerald-400 text-[10px] overflow-x-auto rounded">
{`// 1. Discover all tools exposed on current screen
const tools = await document.modelContext.getTools();
console.log(tools);

// 2. Navigate to ranking battle arena
await document.modelContext.executeTool('navigate_to_screen', { screen: 'ranking' });

// 3. Start PVP match immediately
await document.modelContext.executeTool('ranking_start_pvp_battle');`}
 </pre>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

export default WebMcpInspectorModal;
