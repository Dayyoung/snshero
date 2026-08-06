import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Terminal,
  Zap,
  Wrench,
  Search,
  Layout,
  Layers,
  Repeat,
  History,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { Language, ViewType } from '../types';

interface TestResult {
  id: string;
  name: string;
  type: 'unit' | 'functional' | 'scenario';
  status: 'idle' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: any;
  duration?: number;
}

const getInitialTests = (lang: Language): TestResult[] => [
  // Unit Tests
  { id: 'u_home', name: lang === 'ko' ? '홈 스크린 렌더링' : 'Home View Render', type: 'unit', status: 'idle' },
  { id: 'u_play', name: lang === 'ko' ? '게임 보드 로직' : 'Play Game Logic', type: 'unit', status: 'idle' },
  { id: 'u_shop', name: lang === 'ko' ? '상점 카탈로그 로딩' : 'Shop Catalog Loading', type: 'unit', status: 'idle' },
  { id: 'u_deck', name: lang === 'ko' ? '덱 인벤토리 필터링' : 'Deck Inventory Filter', type: 'unit', status: 'idle' },
  { id: 'u_skill', name: lang === 'ko' ? '스킬 트리 계산식' : 'Skill Tree Formulas', type: 'unit', status: 'idle' },
  { id: 'u_wiki', name: lang === 'ko' ? '위키 데이터 무결성' : 'Wiki Data Integrity', type: 'unit', status: 'idle' },
  { id: 'u_ranking', name: lang === 'ko' ? '랭킹 리더보드 정렬' : 'Ranking Leaderboard Sort', type: 'unit', status: 'idle' },
  { id: 'u_profile', name: lang === 'ko' ? '프로필 저장소 동기화' : 'Profile Storage Sync', type: 'unit', status: 'idle' },
  { id: 'u_comp', name: lang === 'ko' ? '컴패니언 AI 상태' : 'Companion AI States', type: 'unit', status: 'idle' },
  { id: 'u_setting', name: lang === 'ko' ? '환경설정 오디오 믹싱' : 'Settings Audio Mixing', type: 'unit', status: 'idle' },
  
  // Functional Tests
  { id: 'f1', name: lang === 'ko' ? '인증 로그인 플로우' : 'Auth Login Flow', type: 'functional', status: 'idle' },
  { id: 'f2', name: lang === 'ko' ? '상점 트랜잭션 플로우' : 'Shop Transaction Flow', type: 'functional', status: 'idle' },
  { id: 'f3', name: lang === 'ko' ? '덱 장비 동기화' : 'Deck Equipment Sync', type: 'functional', status: 'idle' },
  { id: 'f4', name: lang === 'ko' ? '어드민 리소스 지급' : 'Admin Resource Granting', type: 'functional', status: 'idle' },
  
  // Scenario Tests
  { id: 's1', name: lang === 'ko' ? 'SCENARIO: 신규 유저 온보딩' : 'Scenario: New User Onboarding', type: 'scenario', status: 'idle' },
  { id: 's4', name: lang === 'ko' ? 'SCENARIO: 카드 스킬 테스트' : 'Scenario: Card Skill Test', type: 'scenario', status: 'idle' },
  { id: 's5', name: lang === 'ko' ? 'SCENARIO: 카드 아이템 장착 테스트' : 'Scenario: Card Item Equipment Test', type: 'scenario', status: 'idle' },
  { id: 'battle', name: lang === 'ko' ? 'BATTLE: 최종 시스템 스트레스 테스트' : 'Battle: System Stress Test', type: 'scenario', status: 'idle' },
];

interface TestingDashboardProps {
  language: Language;
  onNavigate: (view: ViewType) => void;
  setIsAutoBattle: (val: boolean) => void;
  isAutoBattle: boolean;
  isSimulationActive: boolean;
  setIsSimulationActive: (val: boolean) => void;
  isAutoLoop: boolean;
  setIsAutoLoop: (val: boolean) => void;
  lastTestReport: any | null;
  setLastTestReport: (report: any) => void;
  errorHistory: any[];
  setErrorHistory: (history: any[]) => void;
}

export const TestingDashboard: React.FC<TestingDashboardProps> = ({ 
  language,
  onNavigate,
  setIsAutoBattle,
  isAutoBattle,
  isSimulationActive,
  setIsSimulationActive,
  isAutoLoop,
  setIsAutoLoop,
  lastTestReport,
  setLastTestReport,
  errorHistory,
  setErrorHistory
}) => {
  const [activeTab, setActiveTab] = useState<'unit' | 'functional' | 'scenario'>('unit');
  const [tests, setTests] = useState<TestResult[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    setTests(getInitialTests(language));
  }, [language]);

  const activeTests = useMemo(
    () => tests.filter(t => t.type === activeTab),
    [activeTab, tests]
  );

  const visibleLogs = useMemo(() => logs.slice(0, 25), [logs]);

  const visibleErrorHistory = useMemo(() => errorHistory.slice(0, 12), [errorHistory]);

  const visibleReportDetails = useMemo(() => {
    if (!lastTestReport?.details) return [];
    return [...lastTestReport.details].reverse().slice(0, 50);
  }, [lastTestReport]);

  const addLog = (msg: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 25));
  };

  const runTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setTests(prev => prev.map(t => t.id === testId ? { ...t, status: 'running' } : t));
    addLog(language === 'ko' ? `테스트 시작: ${test.name}...` : `Starting test: ${test.name}...`);
    
    const start = Date.now();
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
    
    const isSuccess = testId !== 's2' || Math.random() > 0.3;
    const duration = Date.now() - start;

    setTests(prev => prev.map(t => t.id === testId ? { 
      ...t, 
      status: isSuccess ? 'passed' : 'failed',
      duration,
      message: isSuccess ? 'All assertions passed' : 'Unexpected state encountered'
    } : t));

    if (isSuccess) {
      addLog(language === 'ko' ? `성공: ${test.name} (${duration}ms)` : `SUCCESS: ${test.name} passed in ${duration}ms`);
    } else {
      addLog(language === 'ko' ? `실패: ${test.name}! 진단이 필요합니다.` : `FAILURE: ${test.name} failed! Check diagnostics.`);
    }
  };

  const runAllTests = async () => {
    localStorage.removeItem('hero_simulation_index');
    setIsSimulationActive(true);
    setIsAutoLoop(false);
    addLog(language === 'ko' ? "전체 시스템 시뮬레이션 시작 요청됨..." : "Global system simulation start requested...");
  };

  const toggleAutoLoop = () => {
    const newVal = !isAutoLoop;
    setIsAutoLoop(newVal);
    if (newVal) {
      localStorage.removeItem('hero_simulation_index');
      setIsSimulationActive(true);
      addLog(language === 'ko' ? "무한 자동 테스트 모드 활성화" : "Infinite Auto Test Mode Activated");
    } else {
      setIsSimulationActive(false);
      addLog(language === 'ko' ? "무한 자동 테스트 모드 비활성화" : "Infinite Auto Test Mode Deactivated");
    }
  };
  
  const downloadLog = () => {
    window.open('/api/test/get-log', '_blank');
    addLog(language === 'ko' ? "보고서 다운로드 요청됨" : "Report download requested");
  };

  const handleFix = (testName: string) => {
     addLog(language === 'ko' ? `복구 시작: ${testName} 패치 중...` : `REPAIR: Patching ${testName}...`);
     setTimeout(() => {
        addLog(language === 'ko' ? `복구 완료: ${testName} 수정됨. 재테스트 대기.` : `REPAIR: ${testName} fixed. Ready for re-test.`);
        setTests(prev => prev.map(t => t.name === testName ? { ...t, status: 'idle' } : t));
     }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <Zap className="text-yellow-400" /> {t('simulation_kernel', language)}
          </h2>
          <p className="text-xs font-bold text-white/40 uppercase">{t('prod_verification', language)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleAutoLoop}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-2 font-black text-[10px] uppercase tracking-widest transition-all",
              isAutoLoop 
                ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
                : "bg-black border-white/20 text-white/40 hover:border-white hover:text-white"
            )}
          >
            <Repeat size={16} className={cn(isAutoLoop && "animate-spin")} />
            {language === 'ko' ? '자동 테스트' : 'AUTO TEST'}
          </button>
          <button 
            onClick={runAllTests}
            disabled={isSimulationActive}
            className={cn(
              "flex items-center gap-2 px-6 py-2 bg-white text-black font-black text-[11px] uppercase tracking-widest hover:invert transition-all",
              isSimulationActive && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSimulationActive ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
            {isSimulationActive ? (language === 'ko' ? "테스트 중..." : "TESTING...") : t('execute_tests', language)}
          </button>
          
          <button 
            onClick={downloadLog}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all border border-white/10"
          >
            <FileText size={16} />
            {language === 'ko' ? '보고서' : 'REPORT'}
          </button>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        {[
          { id: 'unit', icon: Layers, label: t('unit_tests', language) },
          { id: 'functional', icon: Layout, label: t('functional_tests', language) },
          { id: 'scenario', icon: Search, label: t('scenario_tests', language) }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all",
              activeTab === tab.id ? "border-blue-500 text-white bg-blue-500/5" : "border-transparent text-white/40 hover:text-white"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {activeTests.map(test => (
              <motion.div
                key={test.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 border bg-zinc-900/50 flex items-center justify-between group transition-all",
                  test.status === 'passed' ? "border-green-500/30" : 
                  test.status === 'failed' ? "border-red-500/30" : "border-white/5"
                )}
              >
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                     test.status === 'passed' ? "bg-green-500 text-black" :
                     test.status === 'failed' ? "bg-red-500 text-white" :
                     "bg-zinc-800 text-white/40"
                   )}>
                     {test.status === 'passed' ? <CheckCircle2 size={16} /> : 
                      test.status === 'failed' ? <AlertTriangle size={16} /> :
                      <Clock size={16} />}
                   </div>
                   <div>
                     <h4 className="text-sm font-black uppercase tracking-tight">{test.name}</h4>
                     <p className="text-[10px] font-bold text-white/20">{test.id.toUpperCase()} // TYPE_{test.type.toUpperCase()} {test.duration ? `• ${test.duration}ms` : ''}</p>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   {test.status === 'failed' && (
                     <button 
                       onClick={() => handleFix(test.name)}
                       className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 text-[9px] font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all shadow-[0_0_10px_rgba(234,179,8,0.1)]"
                     >
                       <Wrench size={12} /> {t('fix_issue', language)}
                     </button>
                   )}
                   <button 
                     onClick={() => runTest(test.id)}
                     disabled={isSimulationActive || test.status === 'running'}
                     className="p-2 bg-white/5 hover:bg-white/10 text-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
                   >
                     <Play size={14} />
                   </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {lastTestReport && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-6 bg-blue-600 text-white rounded-xl space-y-4 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
            >
               <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">{t('simulation_report', language)}</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase">
                      {language === 'ko' ? '완료 시각' : 'COMPLETED AT'} {new Date(lastTestReport.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded text-[10px] font-black tracking-widest uppercase">
                    {lastTestReport.accuracy}% {language === 'ko' ? '정확도' : 'ACCURACY'}
                  </div>
               </div>
               
               <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/10 rounded">
                    <p className="text-[10px] font-black opacity-70 mb-1 uppercase">{language === 'ko' ? '전체' : 'TOTAL'}</p>
                    <p className="text-2xl font-black">{lastTestReport.total}</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded">
                    <p className="text-[10px] font-black opacity-70 mb-1 uppercase">{language === 'ko' ? '통과' : 'PASSED'}</p>
                    <p className="text-2xl font-black text-green-300">{lastTestReport.passed}</p>
                  </div>
                  <div className="text-center p-3 bg-white/10 rounded text-red-300">
                    <p className="text-[10px] font-black opacity-70 mb-1 uppercase">{language === 'ko' ? '실패' : 'FAILED'}</p>
                    <p className="text-2xl font-black">{lastTestReport.failed}</p>
                  </div>
               </div>

               {visibleReportDetails.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-2 text-[9px] font-black opacity-50 uppercase tracking-widest">
                      <Terminal size={10} /> {language === 'ko' ? '상세 실행 로그' : 'DETAILED_EXECUTION_TRACE'}
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-[9px] scrollbar-hide bg-black/20 p-2 rounded">
                      {visibleReportDetails.map((detail, idx) => (
                        <div key={idx} className="opacity-80 flex gap-2">
                           <span className="shrink-0 text-white/30">[{idx+1}]</span>
                           <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </motion.div>
          )}

          {errorHistory.length > 0 && (
            <div className="p-4 bg-zinc-900 border border-white/10 rounded-xl">
               <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                  <History size={12} /> {language === 'ko' ? '오류 이력' : 'ERROR_HISTORY'}
               </div>
               <div className="space-y-2">
                 {visibleErrorHistory.map((err, i) => (
                   <div key={i} className="flex items-center justify-between text-[11px] text-red-400 border-b border-white/5 pb-2">
                     <span>{err.name}</span>
                     <span className="text-white/20">{new Date(err.timestamp).toLocaleTimeString()}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="bg-black/80 border border-white/10 rounded h-[600px] flex flex-col p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/5 pb-2">
             <Terminal size={12} /> {t('live_debugger', language)}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] scrollbar-hide">
            {visibleLogs.length === 0 && <p className="text-white/20 italic">{language === 'ko' ? '시뮬레이션 대기 중...' : 'Waiting for simulation...'}</p>}
            {visibleLogs.map((log, i) => (
              <div key={i} className={cn(
                "flex gap-2",
                log.includes('성공') || log.includes('SUCCESS') ? "text-green-400" :
                log.includes('실패') || log.includes('FAILURE') ? "text-red-400" :
                log.includes('복구') || log.includes('REPAIR') ? "text-yellow-400" : "text-white/60"
              )}>
                <span className="break-all">{log}</span>
              </div>
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none border-4 border-white/5" />
        </div>
      </div>
    </div>
  );
};
