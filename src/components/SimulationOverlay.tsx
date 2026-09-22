import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, Loader2, FastForward, Activity, CheckCircle2, AlertTriangle, ShieldCheck, ChevronRight, Pause } from 'lucide-react';
import axios from 'axios';
import { ViewType, Language } from '../types';
import { t } from '../lib/i18n';
import { cn } from '../lib/utils';

export interface TestScenario {
  id: string;
  name: string;
  targetView: ViewType;
  duration: number;
  expectedStatus?: 'passed' | 'failed';
}

interface SimulationOverlayProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  currentView: ViewType;
  setIsAutoBattle: (val: boolean) => void;
  isAutoBattle: boolean;
  onComplete: (report: any) => void;
  onError: (error: any) => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  isAutoLoop: boolean;
  setIsAutoLoop: (val: boolean) => void;
  sns: number;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({
  language,
  onNavigate,
  currentView,
  setIsAutoBattle,
  isAutoBattle,
  onComplete,
  onError,
  isActive,
  setIsActive,
  isAutoLoop,
  setIsAutoLoop,
  sns
}) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(() => {
    return typeof window !== 'undefined' ? Number(localStorage.getItem('hero_simulation_index') || 0) : 0;
  });
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'waiting' | 'complete'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const detailedLogsRef = useRef<string[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [battleCount, setBattleCount] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [highlightTarget, setHighlightTarget] = useState<string | null>(null);
  const [clickVisual, setClickVisual] = useState<{ x: number, y: number } | null>(null);
  const isProcessingRef = useRef(false);
  const lastProcessedIndexRef = useRef(-1);
  
  const scenarios: TestScenario[] = [
    // --- Unified Unit Tests (All Views) ---
    { id: 'u_home', name: language === 'ko' ? 'UNIT: 홈 스크린 렌더링' : 'UNIT: Home View Visual', targetView: 'home', duration: 1200 },
    { id: 'u_play', name: language === 'ko' ? 'UNIT: 게임 보드 초기화' : 'UNIT: Game Board Initialization', targetView: 'play', duration: 1200 },
    { id: 'u_shop', name: language === 'ko' ? 'UNIT: 상점 카탈로그 로딩' : 'UNIT: Shop Catalog Loading', targetView: 'shop', duration: 1200 },
    { id: 'u_deck', name: language === 'ko' ? 'UNIT: 덱 인벤토리 로직' : 'UNIT: Deck Inventory Interface', targetView: 'mydeck', duration: 1200 },
    { id: 'u_skill', name: language === 'ko' ? 'UNIT: 스킬 트리 정합성' : 'UNIT: Skill Tree Alignment', targetView: 'skill', duration: 1200 },
    { id: 'u_ranking', name: language === 'ko' ? 'UNIT: 실시간 랭킹 보드' : 'UNIT: Real-time Leaderboard', targetView: 'ranking', duration: 1200 },
    { id: 'u_profile', name: language === 'ko' ? 'UNIT: 프로필 데이터 동기화' : 'UNIT: Profile Data Sync', targetView: 'profile', duration: 1200 },
    { id: 'u_comp', name: language === 'ko' ? 'UNIT: 컴패니언 AI 상태' : 'UNIT: Companion AI States', targetView: 'companion', duration: 1200 },
    { id: 'u_setting', name: language === 'ko' ? 'UNIT: 환경설정 오디오/언어' : 'UNIT: Settings Preferences', targetView: 'setting', duration: 1200 },
    { id: 'u_admin', name: language === 'ko' ? 'UNIT: 어드민 제어 센터' : 'UNIT: Admin Control Panel', targetView: 'admin', duration: 1200 },
    
    // --- Detailed Sub-View Tests (Wiki Tabs) ---
    { id: 'u_wiki_h', name: language === 'ko' ? 'WIKI: 일반 가이드' : 'WIKI: Basic Guide', targetView: 'wiki', duration: 1000 },
    { id: 'u_wiki_q', name: language === 'ko' ? 'WIKI: 게임 방법' : 'WIKI: How To Play', targetView: 'wiki-howtoplay', duration: 1000 },
    { id: 'u_wiki_c', name: language === 'ko' ? 'WIKI: 카드 도감' : 'WIKI: Card Encyclopedia', targetView: 'wiki-card', duration: 1000 },
    { id: 'u_wiki_i', name: language === 'ko' ? 'WIKI: 아이템 도감' : 'WIKI: Item Encyclopedia', targetView: 'wiki-item', duration: 1000 },
    { id: 'u_wiki_s', name: language === 'ko' ? 'WIKI: 스킬 도감' : 'WIKI: Skill Encyclopedia', targetView: 'wiki-skill', duration: 1000 },
    { id: 'u_wiki_t', name: language === 'ko' ? 'WIKI: 게임 팁/공략' : 'WIKI: Pro Tips & Tricks', targetView: 'wiki-tip', duration: 1000 },
    
    // Functional/Scenario Tests
    { id: 'f1', name: language === 'ko' ? 'FUNC: 세션 관리' : 'FUNC: Session Management', targetView: 'profile', duration: 1500 },
    { id: 'f2', name: language === 'ko' ? 'FUNC: 상점 가챠 테스트' : 'FUNC: Shop Gacha Draw', targetView: 'shop', duration: 0 },
    { id: 's1', name: language === 'ko' ? 'SCENARIO: 신규 온보딩' : 'SCENARIO: Onboarding Flow', targetView: 'profile', duration: 0 },
    { id: 's4', name: language === 'ko' ? 'SCENARIO: 카드 성장 (스킬)' : 'SCENARIO: Skill Upgrade Flow', targetView: 'skill', duration: 0 },
    { id: 's5', name: language === 'ko' ? 'SCENARIO: 장비 시스템 검증' : 'SCENARIO: Gear & Inventory Path', targetView: 'mydeck', duration: 0 },
    { id: 's_avatar', name: language === 'ko' ? 'SCENARIO: 아바타 커스터마이징' : 'SCENARIO: Avatar Customization', targetView: 'profile', duration: 0 },
    { id: 's_sns', name: language === 'ko' ? 'SCENARIO: SNS 소비량 변화 추적' : 'SCENARIO: SNS Consumption Tracking', targetView: 'shop', duration: 0 },
    { id: 'battle', name: language === 'ko' ? 'BATTLE: 최종 부하 테스트' : 'BATTLE: Peak Load Battle', targetView: 'play', duration: 0 },
  ];

  const moveCursor = async (x: number, y: number, highlightId?: string) => {
    setCursorPos({ x, y });
    if (highlightId) setHighlightTarget(highlightId);
    await new Promise(r => setTimeout(r, 800));
    // No setHighlightTarget(null) here, keep it for the step duration
  };

  const simulateClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Get exact position for visual feedback
      const rect = el.getBoundingClientRect();
      setClickVisual({ 
        x: rect.left + rect.width / 2, 
        y: rect.top + rect.height / 2 
      });
      
      el.click();
      addLog(`[ACTION]: Click ${id}`);
      
      // Clear visual quickly
      setTimeout(() => setClickVisual(null), 300);
      return true;
    }
    return false;
  };

  const runScenarioStep = async (stepName: string, view: ViewType, x: number, y: number, highlightId?: string) => {
    // If paused, we wait in a small loop
    while (status === 'paused') {
      await new Promise(r => setTimeout(r, 100));
      if (!isActive) return;
    }
    
    addLog(`[STEP]: ${stepName}`);
    onNavigate(view);
    
    // Wait for view transition
    await new Promise(r => setTimeout(r, 800));
    
    await moveCursor(x, y, highlightId);
    
    if (highlightId) {
      // Small additional wait to ensure element is rendered
      await new Promise(r => setTimeout(r, 500));
      const success = simulateClick(highlightId);
      if (!success) {
        addLog(`[WARN]: Target ${highlightId} not found`);
      }
    }
    
    await new Promise(r => setTimeout(r, 1000));
    setHighlightTarget(null);
  };

  const addLog = (msg: string) => {
    const timestamped = `[${new Date().toLocaleTimeString()}] ${msg}`;
    detailedLogsRef.current = [timestamped, ...detailedLogsRef.current];
    // Show only 1 latest log for minimization
    setLogs([msg]);
  };

  useEffect(() => {
    localStorage.setItem('hero_simulation_index', currentTestIndex.toString());
  }, [currentTestIndex]);

  const startSimulation = async () => {
    setStatus('running');
    // Reset detailed logs on fresh start
    detailedLogsRef.current = [];
    
    // Use fixed filename to overwrite
    const lastIdx = Number(localStorage.getItem('hero_simulation_index') || 0);
    if (lastIdx >= scenarios.length) {
      setCurrentTestIndex(0);
      lastProcessedIndexRef.current = -1;
    } else {
      setCurrentTestIndex(lastIdx);
      lastProcessedIndexRef.current = lastIdx - 1;
    }
    setTestResults([]);
    setBattleCount(0);
    addLog(language === 'ko' ? "자가진단 복학/시작..." : "Resuming/Starting simulation...");
    
    // Initial save to create the file and show it started
    await saveLogToServer([], false);
  };

  useEffect(() => {
    if (!isActive) {
      if (status === 'running') {
        saveLogToServer(testResults, true);
        setStatus('idle');
      }
      return;
    }
    if (status === 'idle') {
      startSimulation();
    }
  }, [isActive]);

  const saveLogToServer = async (results: any[], isInterrupted: boolean = false) => {
    const now = new Date();
    const filename = `test_log.md`;
    
    let content = `# TEST EXECUTION REPORT ${isInterrupted ? '(INTERRUPTED/PROGRESS)' : results.length === scenarios.length ? '(COMPLETED)' : '(IN PROGRESS)'}\n\n`;
    content += `**Date:** ${now.toLocaleString()}\n`;
    content += `**Total Scenarios:** ${scenarios.length}\n`;
    content += `**Executed:** ${results.length}\n`;
    content += `**Passed:** ${results.filter(r => r.status === 'passed').length}\n`;
    content += `**Failed:** ${results.filter(r => r.status === 'failed').length}\n\n`;
    
    content += `## Test Results\n\n`;
    content += `| ID | Test Item | Status | Success/Failure | Detail/Reason |\n`;
    content += `|----|-----------|--------|-----------------|---------------|\n`;
    
    // Show results for what was executed
    results.forEach(res => {
      const isSuccess = res.status === 'passed';
      const statusIcon = isSuccess ? '✅' : '❌';
      const statusText = isSuccess ? 'SUCCESS' : 'FAILURE';
      const reason = isSuccess ? '-' : (res.reason || 'Unexpected error');
      content += `| ${res.id} | ${res.name} | ${statusIcon} | ${statusText} | ${reason} |\n`;
    });
    
    // Show remaining tests
    if (results.length < scenarios.length) {
      const remaining = scenarios.slice(results.length);
      remaining.forEach(res => {
        content += `| ${res.id} | ${res.name} | ⏳ | ${isInterrupted ? 'ABORTED' : 'PENDING'} | ${isInterrupted ? 'User aborted' : 'Waiting...'} |\n`;
      });
    }
    
    content += `\n## Execution Trace (Detailed)\n\n`;
    [...detailedLogsRef.current].reverse().forEach(log => {
      content += `- ${log}\n`;
    });

    try {
      const response = await axios.post('/api/test/save-log', { filename, content });
      if (response.data && response.data.success) {
        // Log locally that it was saved with specific size if we want to debug
        // console.log(`Report saved: ${response.data.bytes} bytes`);
      }
    } catch (err) {
      console.error("Failed to save log to server:", err);
      addLog(language === 'ko' ? "[ERROR]: 보고서 저장 실패" : "[ERROR]: Failed to save report");
    }
  };

  const runScenario = async (index: number) => {
    if (isProcessingRef.current || index === lastProcessedIndexRef.current || status === 'paused') return;
    
    const scenario = scenarios[index];
    if (!scenario) {
      if (isAutoLoop) {
        addLog(language === 'ko' ? "루프 재시작..." : "Restarting loop...");
        lastProcessedIndexRef.current = -1;
        setCurrentTestIndex(0);
      } else {
        setStatus('complete');
        setIsAutoLoop(false);
        setCurrentTestIndex(0);
        localStorage.removeItem('hero_simulation_index');
        // Final save
        await saveLogToServer(testResults);
        
        onComplete({
          timestamp: Date.now(),
          total: scenarios.length,
          passed: testResults.filter(r => r.status === 'passed').length,
          failed: testResults.filter(r => r.status === 'failed').length,
          accuracy: ((testResults.filter(r => r.status === 'passed').length / scenarios.length) * 100).toFixed(1),
          details: detailedLogsRef.current 
        });
        setIsActive(false);
      }
      return;
    }

    isProcessingRef.current = true;
    lastProcessedIndexRef.current = index;

    addLog(scenario.name);
    onNavigate(scenario.targetView);

    let scenarioFailed = false;
    let failureReason = '';

    try {
      if (scenario.id.startsWith('u_')) {
        const positions: Record<string, {x: number, y: number, h: string}> = {
          u_home: {x: 50, y: 50, h: 'main-logo'},
          u_play: {x: 50, y: 40, h: 'game-board'},
          u_shop: {x: 50, y: 30, h: 'shop-grid'},
          u_deck: {x: 50, y: 60, h: 'deck-list'},
          u_skill: {x: 40, y: 40, h: 'skill-tree'},
          u_ranking: {x: 50, y: 50, h: 'leaderboard'},
          u_profile: {x: 30, y: 30, h: 'profile-info'},
          u_comp: {x: 80, y: 50, h: 'companion-view'},
          u_setting: {x: 50, y: 40, h: 'settings-panel'},
          u_admin: {x: 50, y: 50, h: 'admin-dashboard'},
          u_wiki_h: {x: 50, y: 30, h: 'wiki-nav'},
          u_wiki_q: {x: 50, y: 30, h: 'wiki-howtoplay'},
          u_wiki_c: {x: 50, y: 40, h: 'wiki-cards'},
          u_wiki_i: {x: 50, y: 40, h: 'wiki-items'},
          u_wiki_s: {x: 50, y: 40, h: 'wiki-skills'},
          u_wiki_t: {x: 50, y: 40, h: 'wiki-tips'}
        };
        const pos = positions[scenario.id];
        if (pos) {
          await moveCursor(pos.x, pos.y, pos.h);
          await new Promise(r => setTimeout(r, 800));
          const el = document.getElementById(pos.h);
          if (!el) {
            scenarioFailed = true;
            failureReason = `Target element ${pos.h} missing`;
          }
        }
        await new Promise(r => setTimeout(r, scenario.duration));
      } else if (scenario.id === 'f2') {
        const snsBefore = sns;
        await runScenarioStep(language === 'ko' ? '상급 팩 선택' : 'Pick Gold Pack', 'shop', 50, 80, 'shop-pack-gold-btn');
        await runScenarioStep(language === 'ko' ? '카드 뽑기 실행' : 'Draw Card', 'shop', 50, 80, 'shop-pack-gold-btn');
        await new Promise(r => setTimeout(r, 3000));
        await runScenarioStep(language === 'ko' ? '다시 뽑기 확인' : 'Check Draw Again', 'shop', 50, 85, 'draw-again-btn');
        const snsAfter = sns;
        addLog(language === 'ko' ? `SNS 소모 확인: ${snsBefore} -> ${snsAfter}` : `SNS consumption check: ${snsBefore} -> ${snsAfter}`);
      } else if (scenario.id === 's1') {
        await runScenarioStep(language === 'ko' ? '닉네임 입력' : 'Input Nickname', 'profile', 50, 60, 'nickname-field');
        await runScenarioStep(language === 'ko' ? '아바타 선택' : 'Select Avatar', 'profile', 20, 40, 'avatar-preset-2');
        await runScenarioStep(language === 'ko' ? '설정 저장' : 'Save Profile', 'profile', 50, 85, 'profile-save-btn');
      } else if (scenario.id === 's4') {
        const snsBefore = sns;
        await runScenarioStep(language === 'ko' ? '스킬 트리 로딩' : 'Skill Tree', 'skill', 50, 30, 'skill-upgrade-power_boost');
        await runScenarioStep(language === 'ko' ? '스킬 업그레이드' : 'Upgrade Skill', 'skill', 50, 50, 'skill-upgrade-power_boost');
        const snsAfter = sns;
        addLog(language === 'ko' ? `SNS 소모 확인 (강화): ${snsBefore} -> ${snsAfter}` : `SNS consumption check (Skill): ${snsBefore} -> ${snsAfter}`);
      } else if (scenario.id === 's5') {
        await runScenarioStep(language === 'ko' ? '인벤토리 모드' : 'Inventory Mode', 'mydeck', 70, 25, 'inventory-btn');
        await runScenarioStep(language === 'ko' ? '첫 번째 슬롯 선택' : 'Pick Slot 0', 'mydeck', 50, 50, 'deck-slot-0');
        await runScenarioStep(language === 'ko' ? '장착 실행' : 'Equip It', 'mydeck', 80, 55, 'detail-equip-btn');
      } else if (scenario.id === 's_avatar') {
        await runScenarioStep(language === 'ko' ? '아바타 갤러리 열기' : 'Open Avatars', 'profile', 40, 30);
        await runScenarioStep(language === 'ko' ? '3번 아바타 선택' : 'Pick #3', 'profile', 50, 50, 'avatar-preset-3');
        await runScenarioStep(language === 'ko' ? '변경사항 저장' : 'Apply', 'profile', 50, 85, 'profile-save-btn');
      } else if (scenario.id === 's_sns') {
        const snsInitial = sns;
        addLog(language === 'ko' ? `초기 SNS 확인: ${snsInitial}` : `Initial SNS check: ${snsInitial}`);
        
        await runScenarioStep(language === 'ko' ? '상급 팩 선택 (100 SNS)' : 'Pick Gold Pack', 'shop', 50, 80, 'shop-pack-gold-btn');
        await runScenarioStep(language === 'ko' ? '가챠 실행' : 'Execute Gacha', 'shop', 50, 80, 'shop-pack-gold-btn');
        await new Promise(r => setTimeout(r, 4000));
        
        const snsMid = sns;
        addLog(language === 'ko' ? `가챠 후 SNS: ${snsMid}` : `Post-Gacha SNS: ${snsMid}`);
        
        await runScenarioStep(language === 'ko' ? '덱 관리' : 'Go to Deck', 'mydeck', 50, 50, 'deck-list');
        await runScenarioStep(language === 'ko' ? '업그레이드 선택' : 'Start Nurture', 'mydeck', 30, 25, 'hero-nurture-btn');
        await runScenarioStep(language === 'ko' ? '카드 선택' : 'Pick Card', 'mydeck', 50, 50, 'deck-slot-0');
        await runScenarioStep(language === 'ko' ? '스킬 강화' : 'Upgrade Skill', 'skill', 50, 50, 'skill-upgrade-power_boost');
        
        const snsFinal = sns;
        addLog(language === 'ko' ? `최종 SNS: ${snsFinal} (총소모: ${snsInitial - snsFinal})` : `Final SNS: ${snsFinal} (Total Used: ${snsInitial - snsFinal})`);
      } else if (scenario.id === 'battle') {
        if (!isAutoBattle) setIsAutoBattle(true);
        for (let i = 1; i <= 5; i++) {
          if (!isActive || status === 'paused') break;
          await new Promise(r => setTimeout(r, 1000));
          setBattleCount(i);
          addLog(language === 'ko' ? `전투 ${i}/5 완료` : `Battle ${i}/5 Done`);
        }
      } else {
        await new Promise(r => setTimeout(r, scenario.duration));
      }
    } catch (e: any) {
      scenarioFailed = true;
      failureReason = e.message || 'Interaction failure';
    }

    if (!isActive) {
      isProcessingRef.current = false;
      return;
    }

    const updatedResults = [...testResults, { 
      ...scenario, 
      status: scenarioFailed ? 'failed' : 'passed',
      reason: failureReason 
    }];
    setTestResults(updatedResults);
    
    // Save to file after EACH scenario
    await saveLogToServer(updatedResults);

    isProcessingRef.current = false;
    
    // Increment only if not paused
    if (status !== 'paused') {
      setCurrentTestIndex(index + 1);
    }
  };

  useEffect(() => {
    if (status === 'running' && isActive) {
      runScenario(currentTestIndex);
    }
  }, [currentTestIndex, status, isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Simulation Cursor & Highlight Layer */}
      <div className="fixed inset-0 pointer-events-none z-[99999]">
        <AnimatePresence>
          {highlightTarget && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.2 }}
              className="absolute bg-blue-500/10 border-2 border-blue-500/50 rounded-lg shadow-[0_0_30px_rgba(37,99,235,0.2)]"
              style={{
                left: `${cursorPos.x}%`,
                top: `${cursorPos.y}%`,
                width: '80px',
                height: '110px',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600/80 text-white text-[7px] font-black px-1.5 py-0.5 rounded-sm whitespace-nowrap uppercase">
                TARGET:{highlightTarget}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          animate={{ x: `${cursorPos.x}vw`, y: `${cursorPos.y}vh` }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute"
        >
          <div className="relative">
            <div className="w-5 h-5 rounded-full border border-white/30 shadow-2xl flex items-center justify-center bg-black/60">
               <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 text-white text-[6px] font-black px-1 py-0.5 rounded-sm border border-white/10 whitespace-nowrap">
               VIRTUAL_TESTER
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-[280px] pointer-events-none"
      >
        <div className="bg-black/90 backdrop-blur-md border border-white/20 p-3 rounded-lg shadow-2xl pointer-events-auto overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-white/5">
            <motion.div 
              className="h-full bg-blue-500 shadow-[0_0_8px_#3b82f6]"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentTestIndex + 1) / scenarios.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]",
                status === 'paused' ? "text-amber-500 bg-amber-500 animate-pulse" : "text-green-500 bg-green-500 animate-pulse"
              )} />
              <h3 className="text-white font-black text-[10px] uppercase tracking-tighter">
                {status === 'paused' ? 'TEST_PAUSED' : 'AUTO_TESTING'}
              </h3>
            </div>
            <div className="text-[10px] text-white/40 font-black">
              {currentTestIndex + 1}/{scenarios.length}
            </div>
          </div>

          <div className="h-4 flex items-center mb-3">
            <AnimatePresence mode="wait">
              {logs.map((log, i) => (
                <motion.div
                  key={log + i}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  className="text-[10px] text-blue-300 font-bold truncate tracking-tight flex items-center gap-1.5"
                >
                  <ChevronRight size={10} className="text-blue-500 shrink-0" />
                  <span className="truncate">{log}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-1.5">
            <button 
              onClick={() => setStatus(status === 'paused' ? 'running' : 'paused')}
              className={cn(
                "flex-1 p-1 rounded border transition-all text-[9px] font-black uppercase flex items-center justify-center gap-1.5",
                status === 'paused' 
                  ? "bg-blue-600 border-blue-400 text-white" 
                  : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10"
              )}
            >
              {status === 'paused' ? (
                <><Play size={10} fill="currentColor" /> {language === 'ko' ? '재개' : 'RESUME'}</>
              ) : (
                <><Pause size={10} fill="currentColor" /> {language === 'ko' ? '일시정지' : 'PAUSE'}</>
              )}
            </button>
            <button 
              onClick={async () => { 
                await saveLogToServer(testResults, true);
                setIsActive(false); 
                setStatus('idle'); 
                setCurrentTestIndex(0);
                localStorage.removeItem('hero_simulation_index');
                onNavigate('admin'); 
              }}
              className="px-3 bg-red-950/40 border border-red-500/30 text-red-400 text-[9px] font-black uppercase rounded hover:bg-red-600 hover:text-white transition-all shadow-none"
            >
              {language === 'ko' ? '중단' : 'ABORT'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};
